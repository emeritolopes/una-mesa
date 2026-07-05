const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function buildRestaurantHtml(opts: {
  customer_name: string
  restaurant_name: string
  date: string
  time: string
  pax: number
  deposit_amount: number
  noshow_url: string
}): string {
  const { customer_name, restaurant_name, date, time, pax, deposit_amount, noshow_url } = opts
  const depositEur = (deposit_amount / 100).toFixed(0)
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Nueva reserva — ${restaurant_name}</title>
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
                      Nueva reserva confirmada
                    </p>
                    <h1 style="margin:0 0 12px;font-size:26px;font-weight:800;color:#121212;line-height:1.2;letter-spacing:-0.5px;">
                      ${customer_name} · ${date} a las ${time}
                    </h1>
                    <p style="margin:0 0 32px;font-size:15px;color:#555;line-height:1.6;">
                      El cliente ha pagado el depósito y su reserva está confirmada en <strong>${restaurant_name}</strong>.
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9F8F5;border-radius:12px;border:1px solid #EDECEA;">
                      <tr>
                        <td style="padding:24px 28px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding-bottom:16px;border-bottom:1px solid #EDECEA;">
                                <p style="margin:0 0 2px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#999;">Cliente</p>
                                <p style="margin:0;font-size:17px;font-weight:700;color:#121212;">${customer_name}</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:16px 0;border-bottom:1px solid #EDECEA;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td width="50%">
                                      <p style="margin:0 0 2px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#999;">Fecha</p>
                                      <p style="margin:0;font-size:16px;font-weight:600;color:#121212;">${date}</p>
                                    </td>
                                    <td width="50%">
                                      <p style="margin:0 0 2px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#999;">Hora</p>
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
                                      <p style="margin:0 0 2px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#999;">Personas</p>
                                      <p style="margin:0;font-size:16px;font-weight:600;color:#121212;">${pax}</p>
                                    </td>
                                    <td width="50%">
                                      <p style="margin:0 0 2px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#999;">Depósito</p>
                                      <p style="margin:0;font-size:16px;font-weight:700;color:#D8552E;">${depositEur}€ <span style="font-size:12px;font-weight:500;color:#999;">· autorizado</span></p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- No-show warning block -->
                <tr>
                  <td style="padding:28px 48px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8F0;border-radius:12px;border:2px solid #D8552E;">
                      <tr>
                        <td style="padding:20px 24px;">
                          <p style="margin:0 0 6px;font-size:13px;font-weight:800;color:#D8552E;text-transform:uppercase;letter-spacing:.5px;">⚠️ Si el cliente no se presenta</p>
                          <p style="margin:0;font-size:13px;color:#555;line-height:1.6;">
                            Usa el botón de abajo <strong>solo si el cliente no apareció</strong>. Al pulsarlo, el depósito de <strong>${depositEur}€ se cobrará automáticamente</strong>. La acción es irreversible.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:20px 48px 40px;" align="center">
                    <a href="${noshow_url}"
                       style="display:inline-block;background:#D8552E;color:#FFFFFF;text-decoration:none;font-family:'Manrope',Arial,sans-serif;font-size:15px;font-weight:800;padding:16px 40px;border-radius:50px;letter-spacing:0.2px;">
                      Marcar como no-show · Cobrar ${depositEur}€
                    </a>
                    <p style="margin:12px 0 0;font-size:11px;color:#AAA;">
                      Enlace válido 24 h desde la hora de la reserva. Solo un uso.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:28px 0 0;">
              <p style="margin:0;font-size:12px;color:#AAA;font-weight:500;">Una Mesa · La mesa que siempre te espera</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function buildHtml(opts: {
  customer_name: string
  restaurant_name: string
  date: string
  time: string
  pax: number
  deposit_amount: number
  payment_link?: string
  menu_url?: string
}): string {
  const { customer_name, restaurant_name, date, time, pax, deposit_amount, payment_link, menu_url } = opts
  const firstName = customer_name.split(' ')[0] || customer_name

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tu reserva en ${restaurant_name}</title>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#F5F4F0;font-family:'Manrope',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F4F0;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header -->
          <!-- Logo Una Mesa -->
          <tr>
            <td align="center" style="padding:0 0 28px 0;">
              <img src="https://app.unamesa.co/una-mesa-logo.png"
                   width="232" height="64"
                   alt="Una Mesa"
                   style="display:block;border:0;">
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.06);">

              <!-- Coral top bar -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#FF5733;height:6px;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Body -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:40px 48px 0;">

                    <!-- Title -->
                    <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#FF5733;">
                      Confirmación de reserva
                    </p>
                    <h1 style="margin:0 0 12px;font-size:28px;font-weight:800;color:#121212;line-height:1.2;letter-spacing:-0.5px;">
                      ¡Tu mesa está<br>confirmada, ${firstName}!
                    </h1>
                    <p style="margin:0 0 32px;font-size:15px;color:#555;line-height:1.6;">
                      Todo listo en <strong style="color:#121212;">${restaurant_name}</strong>. Aquí tienes los detalles de tu reserva.
                    </p>

                    <!-- Details card -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9F8F5;border-radius:12px;border:1px solid #EDECEA;">
                      <tr>
                        <td style="padding:24px 28px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding-bottom:16px;border-bottom:1px solid #EDECEA;">
                                <p style="margin:0 0 2px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#999;">Restaurante</p>
                                <p style="margin:0;font-size:17px;font-weight:700;color:#121212;">${restaurant_name}</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:16px 0;border-bottom:1px solid #EDECEA;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td width="50%">
                                      <p style="margin:0 0 2px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#999;">Fecha</p>
                                      <p style="margin:0;font-size:16px;font-weight:600;color:#121212;">${date}</p>
                                    </td>
                                    <td width="50%">
                                      <p style="margin:0 0 2px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#999;">Hora</p>
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
                                      <p style="margin:0 0 2px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#999;">Personas</p>
                                      <p style="margin:0;font-size:16px;font-weight:600;color:#121212;">${pax}</p>
                                    </td>
                                    <td width="50%">
                                      <p style="margin:0 0 2px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#999;">Depósito</p>
                                      <p style="margin:0;font-size:16px;font-weight:700;color:#FF5733;">${(deposit_amount / 100).toFixed(0)}€ <span style="font-size:12px;font-weight:500;color:#999;">· reembolsable</span></p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Deposit note -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;background:#FFF5F2;border-radius:10px;border-left:3px solid #FF5733;">
                      <tr>
                        <td style="padding:14px 18px;">
                          <p style="margin:0;font-size:13px;color:#555;line-height:1.5;">
                            Tu depósito de <strong style="color:#121212;">${(deposit_amount / 100).toFixed(0)}€</strong> se descuenta del total de tu ticket cuando llegas al restaurante. Si necesitas cancelar, hazlo con más de 24h de antelación para recuperarlo íntegro.
                          </p>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                <!-- Botón carta del restaurante — solo si se proporciona -->
                ${menu_url ? `
                <tr>
                  <td style="padding:20px 48px 0;" align="center">
                    <a href="${menu_url}"
                       style="display:inline-block;background:#FAF6F0;color:#D8552E;text-decoration:none;font-family:'Manrope',Arial,sans-serif;font-size:14px;font-weight:700;padding:14px 36px;border-radius:50px;border:2px solid #D8552E;">
                      Ver la carta del restaurante
                    </a>
                    <p style="margin:12px 0 0;font-size:12px;color:#999;">
                      Consulta el menú antes de llegar y llega listo para pedir.
                    </p>
                  </td>
                </tr>
                ` : ''}

                <!-- Payment Link button — solo si se proporciona -->
                ${payment_link ? `
                <tr>
                  <td style="padding:20px 48px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8F0;border-radius:10px;border-left:3px solid #D8552E;">
                      <tr>
                        <td style="padding:16px 20px;">
                          <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#D8552E;">⏳ Reserva pendiente de confirmación</p>
                          <p style="margin:0;font-size:13px;color:#555;line-height:1.5;">
                            Para <strong>garantizar tu mesa</strong>, completa el pago del depósito de <strong>${(deposit_amount/100).toFixed(0)}€</strong> antes de <strong>2 horas</strong>.
                            Si no se recibe el pago, la reserva se cancelará automáticamente.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 48px 0;" align="center">
                    <a href="${payment_link}"
                       style="display:inline-block;background:#D8552E;color:#FFFFFF;text-decoration:none;font-family:'Manrope',Arial,sans-serif;font-size:15px;font-weight:700;padding:14px 36px;border-radius:50px;">
                      Confirmar mesa — Pagar ${(deposit_amount/100).toFixed(0)}€
                    </a>
                  </td>
                </tr>
                ` : ''}

                <!-- CTA button -->
                <tr>
                  <td style="padding:32px 48px 40px;" align="center">
                    <a href="https://app.unamesa.co"
                       style="display:inline-block;background:#FF5733;color:#FFFFFF;text-decoration:none;font-family:'Manrope',Arial,sans-serif;font-size:15px;font-weight:700;padding:14px 36px;border-radius:50px;letter-spacing:0.2px;">
                      Ver mi reserva
                    </a>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:28px 0 0;">
              <p style="margin:0;font-size:12px;color:#AAA;font-weight:500;">
                Una Mesa · La mesa que siempre te espera
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:#CCC;">
                Has recibido este email porque realizaste una reserva en Una Mesa.
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
    const { to, customer_name, restaurant_name, date, time, pax, deposit_amount, payment_link, menu_url, noshow_url } = await req.json()

    if (!to || !restaurant_name) {
      return new Response(JSON.stringify({ error: 'to and restaurant_name are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = Deno.env.get('RESEND_API_KEY') ?? ''

    // noshow_url present → restaurant notification email
    const isRestaurant = !!noshow_url
    const html = isRestaurant
      ? buildRestaurantHtml({ customer_name: customer_name || to, restaurant_name, date: date || '', time: time || '', pax: pax || 1, deposit_amount: deposit_amount || 0, noshow_url })
      : buildHtml({ customer_name: customer_name || to, restaurant_name, date, time, pax: pax || 1, deposit_amount: deposit_amount || 0, payment_link, menu_url })

    const subject = isRestaurant
      ? `Nueva reserva: ${customer_name} · ${date} ${time}`
      : `¡Tu mesa en ${restaurant_name} está confirmada!`

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:    'reservas@unamesa.co',
        to:      [to],
        subject,
        html,
      }),
    })

    const resendJson = await resendRes.json().catch(() => ({}))

    if (!resendRes.ok) {
      // Fall back to Resend's sandbox sender if domain not verified
      if (resendRes.status === 403 || resendRes.status === 422) {
        const retryRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type':  'application/json',
          },
          body: JSON.stringify({
            from:    'reservas@unamesa.co',
            to:      [to],
            subject,
            html,
          }),
        })
        const retryJson = await retryRes.json().catch(() => ({}))
        if (!retryRes.ok) throw new Error(retryJson.message || 'Resend error')
        return new Response(JSON.stringify({ id: retryJson.id, from: 'onboarding@resend.dev' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      throw new Error(resendJson.message || 'Resend error')
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
