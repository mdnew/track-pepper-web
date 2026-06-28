import http from 'node:http'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const distDir = path.join(root, 'dist')
const outDir = path.join(root, 'public/assets')
const outPath = path.join(outDir, 'og-screenshot.png')

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
}

function startStaticServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0])
      const filePath = path.join(distDir, urlPath === '/' ? 'index.html' : urlPath)
      import('node:fs').then(({ readFileSync, existsSync, statSync }) => {
        try {
          let target = filePath
          if (!existsSync(target) || statSync(target).isDirectory()) {
            target = path.join(distDir, 'index.html')
          }
          const ext = path.extname(target)
          res.writeHead(200, { 'Content-Type': mimeTypes[ext] ?? 'application/octet-stream' })
          res.end(readFileSync(target))
        } catch {
          res.writeHead(404).end('Not found')
        }
      })
    })
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address()
      resolve({ server, port })
    })
  })
}

async function main() {
  const { chromium } = await import('playwright')
  const { server, port } = await startStaticServer()

  try {
    const browser = await chromium.launch()
    const page = await browser.newPage({
      viewport: { width: 1200, height: 800 },
      deviceScaleFactor: 2,
    })

    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' })
    await page.waitForSelector('.app-screenshot-frame')

    await mkdir(outDir, { recursive: true })
    await page.locator('.home-hero').screenshot({
      path: outPath,
      type: 'png',
    })

    await browser.close()
    console.log(`Wrote ${outPath}`)
  } finally {
    server.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
