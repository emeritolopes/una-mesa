/* Serves the right landing page for "/" depending on the host.
   unamesa.co / www.unamesa.co -> index-madrid.html (Spanish, Madrid)
   anything else (unamesa.co.uk, previews, localhost) -> index.html (London)

   Why a function and not a `rewrites` entry in vercel.json: apps/web has a
   static index.html at the root, and Vercel checks the filesystem BEFORE
   `rewrites`, so a host rewrite for "/" never ran and unamesa.co kept
   serving the London page. Same pattern as apps/app/api/index.js. */

const fs = require('fs')
const path = require('path')

const SPANISH_HOSTS = new Set(['unamesa.co', 'www.unamesa.co'])

module.exports = (req, res) => {
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '')
    .toLowerCase()
    .split(',')[0]
    .trim()
    .replace(/:\d+$/, '')
  const file = SPANISH_HOSTS.has(host) ? 'index-madrid.html' : 'index.html'

  let html
  try {
    html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8')
  } catch (e) {
    res.status(500).send(file + ' not found')
    return
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate')
  res.status(200).send(html)
}
