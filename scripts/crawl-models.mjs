import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MODELS_PATH = resolve(__dirname, '..', 'data', 'models.json')

const PROVIDERS = [
  {
    key: 'volcengine',
    url: 'https://www.volcengine.com/docs/82379/1928261?lang=zh',
    pattern: /(doubao|deepseek|glm|kimi|minimax|ark)-[a-zA-Z0-9._-]+/g,
    exclude: ['ark-helper', 'ark-code-latest', 'minimax-m2.7'],
  },
  {
    key: 'bailian',
    url: 'https://help.aliyun.com/zh/model-studio/coding-plan',
    pattern: /(qwen|claude|deepseek|glm|kimi|minimax|doubao)-[a-zA-Z0-9._-]+/g,
  },
]

async function crawl(browser, { url, pattern, exclude = [] }) {
  const page = await browser.newPage()
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 })
  // 等页面 JS 渲染完内容
  await page.waitForTimeout(3000)
  const text = await page.textContent('body')
  await page.close()

  const matches = text.match(pattern) ?? []
  return [...new Set(matches)].filter((m) => !exclude.includes(m)).sort()
}

async function main() {
  const existing = JSON.parse(readFileSync(MODELS_PATH, 'utf8'))

  const browser = await chromium.launch({ headless: true })
  try {
    for (const { key, url, pattern, exclude } of PROVIDERS) {
      const models = await crawl(browser, { url, pattern, exclude })
      if (models.length > 0) {
        existing.providers[key].models = models
      } else {
        process.stderr.write(`⚠ ${key}: 未爬到模型，保留原列表\n`)
      }
    }
  } finally {
    await browser.close()
  }

  existing.updated_at = new Date().toISOString().slice(0, 10)
  writeFileSync(MODELS_PATH, JSON.stringify(existing, null, 2) + '\n')
}

main().catch((err) => {
  process.stderr.write(err.stack + '\n')
  process.exit(1)
})
