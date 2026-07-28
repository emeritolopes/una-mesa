/* ════ UNA MESA · función de servidor para meta tags correctos ════
   Los bots de WhatsApp/Facebook/Twitter nunca ejecutan JavaScript — solo
   leen el HTML crudo tal cual llega del servidor. El arreglo de ayer
   (actualizar los meta tags con JS después de cargar) nunca iba a
   funcionar para las vistas previas de compartir, solo para lo que ve
   un humano en el navegador. Esta función sirve el HTML real, pero con
   los meta tags ya correctos según el dominio, antes de que cualquier
   script corra.
*/

const fs = require('fs')
const path = require('path')

const SEO = {
  en: {
    title: "Una Mesa — Reserve Your Table at London's Best Restaurants",
    description: 'Book a table at the best restaurants with a refundable deposit — no queues, no no-shows. London.',
    domain: 'app.unamesa.co.uk',
    image: 'og-image.jpg',
  },
  es: {
    title: 'Una Mesa — Reserva tu Mesa en los Mejores Restaurantes',
    description: 'Reserva mesa en los mejores restaurantes con un depósito reembolsable — sin colas de espera, sin no-shows. Madrid.',
    domain: 'app.unamesa.co',
    image: 'og-image-es.jpg',
  },
}

module.exports = (req, res) => {
  const host = (req.headers.host || '').toLowerCase()
  const lang = host.endsWith('.co.uk') ? 'en' : 'es'
  const seo = SEO[lang]
  const ogImage = `https://${seo.domain}/${seo.image}`
  const canonicalUrl = `https://${seo.domain}/`

  let html
  try {
    html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8')
  } catch (e) {
    res.status(500).send('index.html not found')
    return
  }

  // Etiquetas canónica y hreflang — antes solo se agregaban con
  // JavaScript después de cargar, lo que Google Search Console reportó
  // como "Duplicado sin canónica seleccionada por el usuario" al
  // encontrar el mismo contenido en app.unamesa.co.uk y app.unamesa.co
  // sin nada que indicara cuál es cuál. Ahora van directo en el HTML
  // que sirve el servidor, con la URL real donde vive el contenido (no
  // el dominio raíz que solo redirige).
  const seoLinks = `
  <link rel="canonical" href="${canonicalUrl}">
  <link rel="alternate" hreflang="en-GB" href="https://app.unamesa.co.uk/">
  <link rel="alternate" hreflang="es" href="https://app.unamesa.co/">
  <link rel="alternate" hreflang="x-default" href="https://app.unamesa.co.uk/">
</head>`

  html = html
    .replace(/<title>.*?<\/title>/, `<title>${seo.title}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${seo.description}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${seo.title}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${seo.description}$2`)
    .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${ogImage}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${seo.title}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${seo.description}$2`)
    .replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${ogImage}$2`)
    .replace(/<\/head>/, seoLinks)

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.status(200).send(html)
}
