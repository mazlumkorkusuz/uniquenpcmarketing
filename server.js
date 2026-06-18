#!/usr/bin/env node
'use strict'

// Default to production when run directly (e.g. on Hostinger via "node server.js")
process.env.NODE_ENV = process.env.NODE_ENV || 'production'

const { createServer } = require('http')
const next = require('next')
const fs = require('fs')
const path = require('path')

const PORT = parseInt(process.env.PORT || '3000', 10)
const PID_FILE = path.join(__dirname, '.server.pid')
const dev = process.env.NODE_ENV !== 'production'

// ── Synchronous sleep (Atomics — valid on Node.js main thread) ────────────────
function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

// ── Single-instance enforcement via PID file ──────────────────────────────────
function enforceOneInstance() {
  if (!fs.existsSync(PID_FILE)) {
    fs.writeFileSync(PID_FILE, String(process.pid), 'utf8')
    return
  }

  const raw = fs.readFileSync(PID_FILE, 'utf8').trim()
  const oldPid = parseInt(raw, 10)

  if (isNaN(oldPid) || oldPid === process.pid) {
    fs.writeFileSync(PID_FILE, String(process.pid), 'utf8')
    return
  }

  try {
    process.kill(oldPid, 0) // throws ESRCH if process doesn't exist
    console.log(`[server] Found existing instance (PID ${oldPid}) — sending SIGTERM…`)
    process.kill(oldPid, 'SIGTERM')
    sleep(4000) // wait 4 s for graceful exit

    try {
      process.kill(oldPid, 0) // still alive?
      console.log(`[server] Still alive after SIGTERM — sending SIGKILL…`)
      process.kill(oldPid, 'SIGKILL')
      sleep(1000)
    } catch {
      // already gone — good
    }
  } catch {
    // ESRCH: stale PID file, process doesn't exist — no action needed
  }

  fs.writeFileSync(PID_FILE, String(process.pid), 'utf8')
  console.log(`[server] PID file updated (${process.pid})`)
}

function removePid() {
  try {
    const raw = fs.readFileSync(PID_FILE, 'utf8').trim()
    // Only remove if it's still our PID (don't clobber a newer instance)
    if (raw === String(process.pid)) fs.unlinkSync(PID_FILE)
  } catch {}
}

// ── Signal + error handlers ────────────────────────────────────────────────────
function setupHandlers(server) {
  let closing = false

  function shutdown(signal) {
    if (closing) return
    closing = true
    console.log(`[server] ${signal} received — closing HTTP server…`)
    server.close(() => {
      removePid()
      console.log('[server] Shutdown complete.')
      process.exit(0)
    })
    // Force-exit after 10 s if connections are still open
    setTimeout(() => {
      console.error('[server] Forced exit after timeout.')
      removePid()
      process.exit(1)
    }, 10_000).unref()
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT',  () => shutdown('SIGINT'))
  process.on('SIGHUP',  () => shutdown('SIGHUP'))
  process.on('exit',    removePid)

  // Log but do NOT exit — keeps the server alive on Hostinger after non-fatal errors
  process.on('uncaughtException', (err) => {
    console.error('[server] Uncaught exception (process kept alive):', err)
  })
  process.on('unhandledRejection', (reason) => {
    console.error('[server] Unhandled rejection (process kept alive):', reason)
  })
}

// ── Boot ──────────────────────────────────────────────────────────────────────
enforceOneInstance()

const app  = next({ dev, dir: __dirname })
const handle = app.getRequestHandler()

app.prepare()
  .then(() => {
    const server = createServer(async (req, res) => {
      try {
        await handle(req, res)
      } catch (err) {
        console.error('[server] Request handler error:', err)
        if (!res.headersSent) {
          res.writeHead(500)
          res.end('Internal Server Error')
        }
      }
    })

    setupHandlers(server)

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(
          `[server] Port ${PORT} is already in use.\n` +
          `  Check for a lingering process: lsof -i :${PORT}`
        )
      } else {
        console.error('[server] HTTP server error:', err)
      }
      removePid()
      process.exit(1)
    })

    server.listen(PORT, () => {
      console.log(
        `[server] Ready — http://localhost:${PORT}  ` +
        `(PID ${process.pid}, env=${process.env.NODE_ENV})`
      )
    })
  })
  .catch((err) => {
    console.error('[server] Failed to start Next.js:', err)
    removePid()
    process.exit(1)
  })
