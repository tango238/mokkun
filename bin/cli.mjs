#!/usr/bin/env node

import { createServer } from 'node:http'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { resolve, dirname, extname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { exec } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = resolve(__dirname, '../dist')

// Parse arguments
const args = process.argv.slice(2)
let yamlFile = null
let port = 3333

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' || args[i] === '-p') {
    port = parseInt(args[i + 1], 10)
    i++
  } else if (args[i] === '--help' || args[i] === '-h') {
    printHelp()
    process.exit(0)
  } else if (!args[i].startsWith('-')) {
    yamlFile = resolve(process.cwd(), args[i])
  }
}

function printHelp() {
  console.log(`
mokkun - YAML-based form & mockup viewer

Usage:
  npx mokkun [options] [yaml-file]

Options:
  -p, --port <port>  Port number (default: 3333)
  -h, --help         Show this help

Examples:
  npx mokkun                     # Start with built-in sample
  npx mokkun ./my-form.yaml      # Open specific YAML file
  npx mokkun -p 8080 form.yaml   # Custom port
`)
}

// Validate YAML file if specified
if (yamlFile) {
  if (!existsSync(yamlFile)) {
    console.error(`Error: File not found: ${yamlFile}`)
    process.exit(1)
  }
  if (!yamlFile.endsWith('.yaml') && !yamlFile.endsWith('.yml')) {
    console.error(`Error: File must be .yaml or .yml: ${yamlFile}`)
    process.exit(1)
  }
}

// Check dist directory exists
if (!existsSync(resolve(distDir, 'mokkun.js'))) {
  console.error('Error: dist/mokkun.js not found. Run "pnpm build:lib" first.')
  process.exit(1)
}

// MIME types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.yaml': 'text/yaml; charset=utf-8',
  '.yml': 'text/yaml; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
}

// Generate viewer HTML
function generateViewerHtml() {
  const yamlParam = yamlFile ? `yaml=${encodeURIComponent('/__yaml__/' + basename(yamlFile))}` : ''
  const viewerHtmlPath = resolve(__dirname, 'viewer.html')
  let html = readFileSync(viewerHtmlPath, 'utf-8')
  if (yamlParam) {
    html = html.replace('/* __YAML_URL__ */', JSON.stringify('/__yaml__/' + basename(yamlFile)))
  }
  return html
}

// Serve files
const server = createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`)
  const pathname = url.pathname

  // Root -> viewer HTML
  if (pathname === '/' || pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(generateViewerHtml())
    return
  }

  // Serve user YAML file
  if (pathname.startsWith('/__yaml__/') && yamlFile) {
    try {
      const content = readFileSync(yamlFile, 'utf-8')
      res.writeHead(200, { 'Content-Type': 'text/yaml; charset=utf-8' })
      res.end(content)
    } catch {
      res.writeHead(404)
      res.end('Not found')
    }
    return
  }

  // Serve dist files (mokkun.js, mokkun.css, etc.)
  const distPath = resolve(distDir, pathname.slice(1))
  if (distPath.startsWith(distDir) && existsSync(distPath) && statSync(distPath).isFile()) {
    const ext = extname(distPath)
    const mime = MIME_TYPES[ext] || 'application/octet-stream'
    try {
      const content = readFileSync(distPath)
      res.writeHead(200, { 'Content-Type': mime })
      res.end(content)
    } catch {
      res.writeHead(500)
      res.end('Internal error')
    }
    return
  }

  res.writeHead(404)
  res.end('Not found')
})

server.listen(port, () => {
  const url = `http://localhost:${port}`
  console.log(`Mokkun viewer running at ${url}`)
  if (yamlFile) {
    console.log(`Serving: ${yamlFile}`)
  }
  console.log('Press Ctrl+C to stop.\n')

  // Open browser
  openBrowser(url)
})

function openBrowser(url) {
  const platform = process.platform
  const cmd =
    platform === 'darwin' ? 'open' :
    platform === 'win32' ? 'start' :
    'xdg-open'

  exec(`${cmd} ${url}`, () => {
    // Ignore errors (e.g., no display server)
  })
}
