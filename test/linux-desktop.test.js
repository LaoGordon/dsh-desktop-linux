'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const test = require('node:test')

const root = path.join(__dirname, '..')
const installScript = path.join(root, 'install.sh')
const packageJson = require('../package.json')
const LINUX_ICON_SIZES = [16, 24, 32, 48, 64, 128, 256, 512, 1024]
const posixOnly = process.platform === 'win32' ? { skip: 'install.sh is POSIX-only' } : {}

function pngSize (file) {
  const buf = fs.readFileSync(file)
  assert.equal(buf.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

test('setup.sh --check reports a usable Node.js 18+ environment', () => {
  const setup = path.join(root, 'setup.sh')
  const result = spawnSync('sh', [setup, '--check'], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr || result.stdout)
  assert.match(result.stdout, /Node\.js v?\d+/)
  assert.match(result.stdout, /OK/)
})

test('Windows packaging uses a committed multi-size ICO', () => {
  assert.equal(packageJson.build.win.icon, 'assets/icon.ico')
  assert.equal(packageJson.build.nsis.installerIcon, 'assets/icon.ico')
  assert.equal(packageJson.build.nsis.uninstallerIcon, 'assets/icon.ico')

  const ico = fs.readFileSync(path.join(root, 'assets', 'icon.ico'))
  assert.equal(ico[0], 0)
  assert.equal(ico[1], 0)
  assert.equal(ico[2], 1)
  assert.equal(ico[3], 0)
  const count = ico.readUInt16LE(4)
  assert.equal(count, 7)
  const sizes = []
  for (let i = 0; i < count; i++) {
    const off = 6 + i * 16
    sizes.push(ico[off] || 256)
  }
  assert.deepEqual(sizes.sort((a, b) => a - b), [16, 24, 32, 48, 64, 128, 256])
})

test('electron-builder ships a multi-size Linux icon set', () => {
  assert.equal(packageJson.build.linux.icon, 'assets/linux-icons')
  assert.equal(packageJson.desktopName, 'deepseek-harness-desktop.desktop')
  assert.equal(packageJson.build.linux.syncDesktopName, true)
  assert.equal(packageJson.build.linux.desktop.entry.StartupWMClass, 'deepseek-harness-desktop')

  for (const size of LINUX_ICON_SIZES) {
    const file = path.join(root, 'assets', 'linux-icons', `${size}x${size}.png`)
    assert.equal(fs.existsSync(file), true, `missing ${file}`)
    const { width, height } = pngSize(file)
    assert.equal(width, size)
    assert.equal(height, size)
  }
})

test('install.sh --print-url resolves a pinned version to the deb URL', posixOnly, () => {
  const result = spawnSync('sh', [installScript, '--print-url'], {
    encoding: 'utf8',
    env: { ...process.env, DSH_DESKTOP_VERSION: 'v1.0.2' }
  })
  assert.equal(result.status, 0, result.stderr || result.stdout)
  assert.equal(
    result.stdout.trim(),
    'https://github.com/LaoGordon/dsh-desktop-linux/releases/download/v1.0.2/DeepSeek-Harness-Desktop-1.0.2-linux-amd64.deb'
  )
})

test('install.sh --print-url accepts a bare version number', posixOnly, () => {
  const result = spawnSync('sh', [installScript, '--print-url'], {
    encoding: 'utf8',
    env: { ...process.env, DSH_DESKTOP_VERSION: '1.0.2' }
  })
  assert.equal(result.status, 0, result.stderr || result.stdout)
  assert.match(result.stdout, /\/releases\/download\/v1\.0\.2\//)
})

test('install.sh rejects an invalid version', posixOnly, () => {
  const result = spawnSync('sh', [installScript, '--print-url'], {
    encoding: 'utf8',
    env: { ...process.env, DSH_DESKTOP_VERSION: 'bad version' }
  })
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /invalid version/)
})
