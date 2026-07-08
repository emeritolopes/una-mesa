const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const ET = {
  es: {
    htmlLang: 'es', currency: '€',
    subject: (r: string) => `Reserva cancelada — ${r}`,
    eyebrow: 'Cancelación confirmada',
    heading: (name: string) => `Tu reserva ha sido<br>cancelada, ${name}.`,
    intro: (r: string) => `Hemos cancelado tu mesa en <strong style="color:#121212;">${r}</strong>. Aquí tienes el resumen.`,
    labelRestaurante: 'Restaurante', labelFecha: 'Fecha', labelHora: 'Hora', labelPersonas: 'Personas', labelDeposito: 'Depósito',
    refundable: 'a reembolsar', forfeited: 'no reembolsable',
    refundNote: (dep: string) => `Tu depósito de <strong style="color:#121212;">${dep}</strong> será reembolsado en <strong style="color:#121212;">5-10 días hábiles</strong> en el método de pago original.`,
    forfeitNote: 'Esta cancelación se hizo con menos de 24 horas de antelación, así que el depósito no es reembolsable — es la misma política que aplica a una no-presentación.',
    cta: 'Buscar otra mesa',
    footerTag: 'Una Mesa · La mesa que siempre te espera',
    footerReceived: 'Has recibido este email porque cancelaste una reserva en Una Mesa.',
  },
  en: {
    htmlLang: 'en', currency: '£',
    subject: (r: string) => `Booking cancelled — ${r}`,
    eyebrow: 'Cancellation confirmed',
    heading: (name: string) => `Your booking has been<br>cancelled, ${name}.`,
    intro: (r: string) => `We've cancelled your table at <strong style="color:#121212;">${r}</strong>. Here's the summary.`,
    labelRestaurante: 'Restaurant', labelFecha: 'Date', labelHora: 'Time', labelPersonas: 'Guests', labelDeposito: 'Deposit',
    refundable: 'to be refunded', forfeited: 'non-refundable',
    refundNote: (dep: string) => `Your <strong style="color:#121212;">${dep}</strong> deposit will be refunded within <strong style="color:#121212;">5-10 business days</strong> to your original payment method.`,
    forfeitNote: "This cancellation was made less than 24 hours in advance, so the deposit isn't refundable — the same policy that applies to a no-show.",
    cta: 'Find another table',
    footerTag: 'Una Mesa · The table that always awaits you',
    footerReceived: "You're receiving this email because you cancelled a booking with Una Mesa.",
  },
}

function buildHtml(opts: {
  customer_name: string
  restaurant_name: string
  date: string
  time: string
  pax: number
  deposit_amount: number
  refunded: boolean
  lang: 'es' | 'en'
}): string {
  const { customer_name, restaurant_name, date, time, pax, deposit_amount, refunded, lang } = opts
  const t = ET[lang] || ET.es
  const firstName = customer_name.split(' ')[0] || customer_name
  const depositAmt = (deposit_amount / 100).toFixed(0)
  const depositLabel = t.currency + depositAmt

  return `<!DOCTYPE html>
<html lang="${t.htmlLang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${t.subject(restaurant_name)}</title>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#F5F4F0;font-family:'Manrope',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F4F0;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <tr>
            <td align="center" style="padding:0 0 28px 0;">
              <img src="https://app.unamesa.co/una-mesa-logo.png" width="232" height="64" alt="Una Mesa" style="display:block;border:0;">
            </td>
          </tr>

          <tr>
            <td style="background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.06);">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="background:#D8552E;height:6px;font-size:0;line-height:0;">&nbsp;</td></tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:40px 48px 0;">
                    <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#D8552E;">
                      ${t.eyebrow}
                    </p>
                    <h1 style="margin:0 0 12px;font-size:28px;font-weight:800;color:#121212;line-height:1.2;letter-spacing:-0.5px;">
                      ${t.heading(firstName)}
                    </h1>
                    <p style="margin:0 0 32px;font-size:15px;color:#555;line-height:1.6;">
                      ${t.intro(restaurant_name)}
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9F8F5;border-radius:12px;border:1px solid #EDECEA;">
                      <tr>
                        <td style="padding:24px 28px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding-bottom:16px;border-bottom:1px solid #EDECEA;">
                                <p style="margin:0 0 2px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#999;">${t.labelRestaurante}</p>
                                <p style="margin:0;font-size:17px;font-weight:700;color:#121212;">${restaurant_name}</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:16px 0;border-bottom:1px solid #EDECEA;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td width="50%">
                                      <p style="margin:0 0 2px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#999;">${t.labelFecha}</p>
                                      <p style="margin:0;font-size:16px;font-weight:600;color:#121212;">${date}</p>
                                    </td>
                                    <td width="50%">
                                      <p style="margin:0 0 2px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#999;">${t.labelHora}</p>
                                      <p style="margin:0;font-size:16px;font-weight:600;color:#121212;">${time}</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:16px 0 0;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td width="50%">
                                      <p style="margin:0 0 2px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#999;">${t.labelPersonas}</p>
                                      <p style="margin:0;font-size:16px;font-weight:600;color:#121212;">${pax}</p>
                                    </td>
                                    <td width="50%">
                                      <p style="margin:0 0 2px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#999;">${t.labelDeposito}</p>
                                      <p style="margin:0;font-size:16px;font-weight:700;color:#D8552E;">${depositLabel} <span style="font-size:12px;font-weight:500;color:#999;">· ${refunded ? t.refundable : t.forfeited}</span></p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;background:#FDF3F0;border-radius:10px;border-left:3px solid #D8552E;">
                      <tr>
                        <td style="padding:14px 18px;">
                          <p style="margin:0;font-size:13px;color:#555;line-height:1.5;">
                            ${refunded ? t.refundNote(depositLabel) : t.forfeitNote}
                          </p>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                <tr>
                  <td style="padding:32px 48px 40px;" align="center">
                    <a href="https://app.unamesa.co"
                       style="display:inline-block;background:#D8552E;color:#FFFFFF;text-decoration:none;font-family:'Manrope',Arial,sans-serif;font-size:15px;font-weight:700;padding:14px 36px;border-radius:50px;letter-spacing:0.2px;">
                      ${t.cta}
                    </a>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:28px 0 0;">
              <p style="margin:0;font-size:12px;color:#AAA;font-weight:500;">
                ${t.footerTag}
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:#CCC;">
                ${t.footerReceived}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { to, customer_name, restaurant_name, date, time, pax, deposit_amount, refunded, lang: langRaw } = await req.json()
    const lang: 'es' | 'en' = langRaw === 'en' ? 'en' : 'es'
    const t = ET[lang]

    if (!to || !restaurant_name) {
      return new Response(JSON.stringify({ error: 'to and restaurant_name are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = Deno.env.get('RESEND_API_KEY') ?? ''
    const html   = buildHtml({
      customer_name: customer_name || to, restaurant_name, date, time,
      pax: pax || 1, deposit_amount: deposit_amount || 0,
      refunded: refunded !== false, lang,
    })

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:    'no-reply@unamesa.co',
        to:      [to],
        subject: t.subject(restaurant_name),
        html,
      }),
    })

    const resendJson = await resendRes.json().catch(() => ({}))

    if (!resendRes.ok) {
      console.error('Resend error:', resendRes.status, JSON.stringify(resendJson))
      throw new Error(`Resend ${resendRes.status}: ${resendJson.message || JSON.stringify(resendJson)}`)
    }

    return new Response(JSON.stringify({ id: resendJson.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
