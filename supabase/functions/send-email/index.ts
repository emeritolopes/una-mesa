const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/* ── Email copy dictionary. 'lang' comes from the caller (booking.jsx sends its market's
   language); defaults to 'es' so any existing caller that doesn't send it keeps working
   exactly as before. ── */
const ET = {
  es: {
    htmlLang: 'es',
    restaurantTitle: (r: string) => `Nueva reserva — ${r}`,
    restaurantEyebrow: 'Nueva reserva confirmada',
    restaurantHeading: (name: string, date: string, time: string) => `${name} · ${date} a las ${time}`,
    restaurantIntro: (r: string) => `El cliente ha pagado el depósito y su reserva está confirmada en <strong>${r}</strong>.`,
    labelCliente: 'Cliente', labelFecha: 'Fecha', labelHora: 'Hora', labelPersonas: 'Personas', labelDeposito: 'Depósito',
    autorizado: 'autorizado',
    noshowWarningTitle: '⚠️ Si el cliente no se presenta',
    noshowWarningBody: (dep: string) => `Usa el botón de abajo <strong>solo si el cliente no apareció</strong>. Al pulsarlo, el depósito de <strong>${dep}€ se cobrará automáticamente</strong>. La acción es irreversible.`,
    noshowButton: () => `Marcar reserva como completada o no-show`,
    noshowValidity: 'Enlace válido 24 h desde la hora de la reserva. Solo un uso.',
    footerTag: 'Una Mesa · La mesa que siempre te espera',
    subjectRestaurant: (name: string, date: string, time: string) => `Nueva reserva: ${name} · ${date} ${time}`,
    subjectStripeInvite: (r: string) => `${r} — conecta tu cuenta de cobro en Una Mesa`,
    stripeInviteHeading: (r: string) => `¡Bienvenido a Una Mesa, ${r}!`,
    stripeInviteBody: 'Para empezar a recibir reservas y sus depósitos, conecta tu cuenta bancaria — el proceso lo gestiona Stripe directamente, es rápido y seguro.',
    stripeInviteButton: 'Conectar mi cuenta de cobro',
    stripeInviteFooter: 'El dinero de cada depósito llega directo a tu cuenta — Una Mesa nunca lo retiene.',

    customerTitle: (r: string) => `Tu reserva en ${r}`,
    confirmEyebrow: 'Confirmación de reserva',
    confirmHeading: (name: string) => `¡Tu mesa está<br>confirmada, ${name}!`,
    confirmIntro: (r: string) => `Todo listo en <strong style="color:#121212;">${r}</strong>. Aquí tienes los detalles de tu reserva.`,
    labelRestaurante: 'Restaurante',
    reembolsable: 'reembolsable',
    depositNote: (dep: string) => `Tu depósito de <strong style="color:#121212;">${dep}€</strong> se descuenta del total de tu ticket cuando llegas al restaurante. Si necesitas cancelar, hazlo con más de 24h de antelación para recuperarlo íntegro.`,
    menuButton: 'Ver la carta del restaurante',
    menuNote: 'Consulta el menú antes de llegar y llega listo para pedir.',
    cancelButton: 'Cancelar mi reserva',
    cancelNote: '¿No puedes venir? Cancela con más de 24h de antelación para recuperar tu depósito.',
    pendingTitle: '⏳ Reserva pendiente de confirmación',
    pendingBody: (dep: string) => `Para <strong>garantizar tu mesa</strong>, completa el pago del depósito de <strong>${dep}€</strong> antes de <strong>2 horas</strong>. Si no se recibe el pago, la reserva se cancelará automáticamente.`,
    payButton: (dep: string) => `Confirmar mesa — Pagar ${dep}€`,
    viewBooking: 'Ver mi reserva',
    footerReceived: 'Has recibido este email porque realizaste una reserva en Una Mesa.',
    subjectCustomer: (r: string) => `¡Tu mesa en ${r} está confirmada!`,
    currency: '€',
  },
  en: {
    htmlLang: 'en',
    restaurantTitle: (r: string) => `New booking — ${r}`,
    restaurantEyebrow: 'New booking confirmed',
    restaurantHeading: (name: string, date: string, time: string) => `${name} · ${date} at ${time}`,
    restaurantIntro: (r: string) => `The customer has paid the deposit and their booking is confirmed at <strong>${r}</strong>.`,
    labelCliente: 'Customer', labelFecha: 'Date', labelHora: 'Time', labelPersonas: 'Guests', labelDeposito: 'Deposit',
    autorizado: 'authorised',
    noshowWarningTitle: '⚠️ If the customer does not show up',
    noshowWarningBody: (dep: string) => `Use the button below <strong>only if the customer didn't show up</strong>. Clicking it will <strong>automatically charge the £${dep} deposit</strong>. This action is irreversible.`,
    noshowButton: () => `Mark booking as completed or no-show`,
    noshowValidity: 'Link valid for 24h from the booking time. Single use only.',
    footerTag: 'Una Mesa · The table that always awaits you',
    subjectRestaurant: (name: string, date: string, time: string) => `New booking: ${name} · ${date} ${time}`,
    subjectStripeInvite: (r: string) => `${r} — connect your payout account on Una Mesa`,
    stripeInviteHeading: (r: string) => `Welcome to Una Mesa, ${r}!`,
    stripeInviteBody: "To start receiving bookings and their deposits, connect your bank account — Stripe handles the process directly, it's quick and secure.",
    stripeInviteButton: 'Connect my payout account',
    stripeInviteFooter: 'Each deposit goes straight to your account — Una Mesa never holds it.',

    customerTitle: (r: string) => `Your booking at ${r}`,
    confirmEyebrow: 'Booking confirmation',
    confirmHeading: (name: string) => `Your table is<br>confirmed, ${name}!`,
    confirmIntro: (r: string) => `You're all set at <strong style="color:#121212;">${r}</strong>. Here are your booking details.`,
    labelRestaurante: 'Restaurant',
    reembolsable: 'refundable',
    depositNote: (dep: string) => `Your <strong style="color:#121212;">£${dep}</strong> deposit is deducted from your bill total when you arrive at the restaurant. If you need to cancel, do so more than 24h in advance to get it back in full.`,
    menuButton: 'View restaurant menu',
    menuNote: 'Check the menu before you arrive and come ready to order.',
    cancelButton: 'Cancel my booking',
    cancelNote: "Can't make it? Cancel more than 24h in advance to get your deposit back.",
    pendingTitle: '⏳ Booking pending confirmation',
    pendingBody: (dep: string) => `To <strong>secure your table</strong>, complete the £${dep} deposit payment within <strong>2 hours</strong>. If payment isn't received, the booking will be cancelled automatically.`,
    payButton: (dep: string) => `Confirm table — Pay £${dep}`,
    viewBooking: 'View my booking',
    footerReceived: "You're receiving this email because you made a booking with Una Mesa.",
    subjectCustomer: (r: string) => `Your table at ${r} is confirmed!`,
    currency: '£',
  },
}

function buildRestaurantHtml(opts: {
  customer_name: string
  restaurant_name: string
  date: string
  time: string
  pax: number
  deposit_amount: number
  noshow_url: string
  lang: 'es' | 'en'
}): string {
  const { customer_name, restaurant_name, date, time, pax, deposit_amount, noshow_url, lang } = opts
  const t = ET[lang] || ET.es
  const depositEur = (deposit_amount / 100).toFixed(0)
  return `<!DOCTYPE html>
<html lang="${t.htmlLang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${t.restaurantTitle(restaurant_name)}</title>
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
                      ${t.restaurantEyebrow}
                    </p>
                    <h1 style="margin:0 0 12px;font-size:26px;font-weight:800;color:#121212;line-height:1.2;letter-spacing:-0.5px;">
                      ${t.restaurantHeading(customer_name, date, time)}
                    </h1>
                    <p style="margin:0 0 32px;font-size:15px;color:#555;line-height:1.6;">
                      ${t.restaurantIntro(restaurant_name)}
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9F8F5;border-radius:12px;border:1px solid #EDECEA;">
                      <tr>
                        <td style="padding:24px 28px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding-bottom:16px;border-bottom:1px solid #EDECEA;">
                                <p style="margin:0 0 2px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#999;">${t.labelCliente}</p>
                                <p style="margin:0;font-size:17px;font-weight:700;color:#121212;">${customer_name}</p>
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
                                      <p style="margin:0;font-size:16px;font-weight:700;color:#D8552E;">${t.currency}${depositEur} <span style="font-size:12px;font-weight:500;color:#999;">· ${t.autorizado}</span></p>
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

                <tr>
                  <td style="padding:28px 48px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8F0;border-radius:12px;border:2px solid #D8552E;">
                      <tr>
                        <td style="padding:20px 24px;">
                          <p style="margin:0 0 6px;font-size:13px;font-weight:800;color:#D8552E;text-transform:uppercase;letter-spacing:.5px;">${t.noshowWarningTitle}</p>
                          <p style="margin:0;font-size:13px;color:#555;line-height:1.6;">
                            ${t.noshowWarningBody(depositEur)}
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
                      ${t.noshowButton()}
                    </a>
                    <p style="margin:12px 0 0;font-size:11px;color:#AAA;">
                      ${t.noshowValidity}
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:28px 0 0;">
              <p style="margin:0;font-size:12px;color:#AAA;font-weight:500;">${t.footerTag}</p>
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
  cancel_url?: string
  lang: 'es' | 'en'
}): string {
  const { customer_name, restaurant_name, date, time, pax, deposit_amount, payment_link, menu_url, cancel_url, lang } = opts
  const t = ET[lang] || ET.es
  const firstName = customer_name.split(' ')[0] || customer_name
  const depositAmt = (deposit_amount / 100).toFixed(0)

  return `<!DOCTYPE html>
<html lang="${t.htmlLang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${t.customerTitle(restaurant_name)}</title>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#F5F4F0;font-family:'Manrope',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F4F0;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <tr>
            <td align="center" style="padding:0 0 28px 0;">
              <img src="https://app.unamesa.co/una-mesa-logo.png"
                   width="232" height="64"
                   alt="Una Mesa"
                   style="display:block;border:0;">
            </td>
          </tr>

          <tr>
            <td style="background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.06);">

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#FF5733;height:6px;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:40px 48px 0;">

                    <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#FF5733;">
                      ${t.confirmEyebrow}
                    </p>
                    <h1 style="margin:0 0 12px;font-size:28px;font-weight:800;color:#121212;line-height:1.2;letter-spacing:-0.5px;">
                      ${t.confirmHeading(firstName)}
                    </h1>
                    <p style="margin:0 0 32px;font-size:15px;color:#555;line-height:1.6;">
                      ${t.confirmIntro(restaurant_name)}
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
                                      <p style="margin:0;font-size:16px;font-weight:700;color:#FF5733;">${t.currency}${depositAmt} <span style="font-size:12px;font-weight:500;color:#999;">· ${t.reembolsable}</span></p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;background:#FFF5F2;border-radius:10px;border-left:3px solid #FF5733;">
                      <tr>
                        <td style="padding:14px 18px;">
                          <p style="margin:0;font-size:13px;color:#555;line-height:1.5;">
                            ${t.depositNote(depositAmt)}
                          </p>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                ${menu_url ? `
                <tr>
                  <td style="padding:20px 48px 0;" align="center">
                    <a href="${menu_url}"
                       style="display:inline-block;background:#FAF6F0;color:#D8552E;text-decoration:none;font-family:'Manrope',Arial,sans-serif;font-size:14px;font-weight:700;padding:14px 36px;border-radius:50px;border:2px solid #D8552E;">
                      ${t.menuButton}
                    </a>
                    <p style="margin:12px 0 0;font-size:12px;color:#999;">
                      ${t.menuNote}
                    </p>
                  </td>
                </tr>
                ` : ''}

                ${payment_link ? `
                <tr>
                  <td style="padding:20px 48px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8F0;border-radius:10px;border-left:3px solid #D8552E;">
                      <tr>
                        <td style="padding:16px 20px;">
                          <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#D8552E;">${t.pendingTitle}</p>
                          <p style="margin:0;font-size:13px;color:#555;line-height:1.5;">
                            ${t.pendingBody(depositAmt)}
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
                      ${t.payButton(depositAmt)}
                    </a>
                  </td>
                </tr>
                ` : ''}

                <tr>
                  <td style="padding:32px 48px 0;" align="center">
                    <a href="https://app.unamesa.co"
                       style="display:inline-block;background:#FF5733;color:#FFFFFF;text-decoration:none;font-family:'Manrope',Arial,sans-serif;font-size:15px;font-weight:700;padding:14px 36px;border-radius:50px;letter-spacing:0.2px;">
                      ${t.viewBooking}
                    </a>
                  </td>
                </tr>

                ${cancel_url ? `
                <tr>
                  <td style="padding:16px 48px 40px;" align="center">
                    <a href="${cancel_url}"
                       style="display:inline-block;color:#999;text-decoration:underline;font-family:'Manrope',Arial,sans-serif;font-size:13px;font-weight:500;">
                      ${t.cancelButton}
                    </a>
                    <p style="margin:8px 0 0;font-size:11px;color:#BBB;">
                      ${t.cancelNote}
                    </p>
                  </td>
                </tr>
                ` : `<tr><td style="padding:0 0 40px;">&nbsp;</td></tr>`}

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

function buildStripeInviteHtml(opts: {
  restaurant_name: string
  self_service_url: string
  lang: 'es' | 'en'
}): string {
  const { restaurant_name, self_service_url, lang } = opts
  const t = ET[lang] || ET.es
  return `<!DOCTYPE html>
<html lang="${t.htmlLang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${t.subjectStripeInvite(restaurant_name)}</title>
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
                <tr><td style="padding:36px 40px;">
                  <p style="margin:0 0 16px 0;font-size:20px;font-weight:800;color:#1a130d;">${t.stripeInviteHeading(restaurant_name)}</p>
                  <p style="margin:0 0 28px 0;font-size:15px;line-height:1.6;color:#555;">${t.stripeInviteBody}</p>
                  <table cellpadding="0" cellspacing="0"><tr><td style="border-radius:10px;background:#D8552E;">
                    <a href="${self_service_url}" style="display:block;padding:14px 28px;color:#fff;text-decoration:none;font-size:14px;font-weight:700;">${t.stripeInviteButton}</a>
                  </td></tr></table>
                  <p style="margin:28px 0 0 0;font-size:12px;color:#999;">${t.stripeInviteFooter}</p>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 0 0 0;">
              <p style="margin:0;font-size:12px;color:#999;">${t.footerTag}</p>
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
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { to, customer_name, restaurant_name, date, time, pax, deposit_amount, payment_link, menu_url, noshow_url, cancel_url, stripe_invite_url, lang: langRaw } = await req.json()
    const lang: 'es' | 'en' = langRaw === 'en' ? 'en' : 'es'
    const t = ET[lang]

    if (!to || !restaurant_name) {
      return new Response(JSON.stringify({ error: 'to and restaurant_name are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = Deno.env.get('RESEND_API_KEY') ?? ''

    const isStripeInvite = !!stripe_invite_url
    const isRestaurant = !isStripeInvite && !!noshow_url
    const html = isStripeInvite
      ? buildStripeInviteHtml({ restaurant_name, self_service_url: stripe_invite_url, lang })
      : isRestaurant
      ? buildRestaurantHtml({ customer_name: customer_name || to, restaurant_name, date: date || '', time: time || '', pax: pax || 1, deposit_amount: deposit_amount || 0, noshow_url, lang })
      : buildHtml({ customer_name: customer_name || to, restaurant_name, date, time, pax: pax || 1, deposit_amount: deposit_amount || 0, payment_link, menu_url, cancel_url, lang })

    const subject = isStripeInvite
      ? t.subjectStripeInvite(restaurant_name)
      : isRestaurant
      ? t.subjectRestaurant(customer_name, date, time)
      : t.subjectCustomer(restaurant_name)

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from: 'Una Mesa <no-reply@unamesa.co>',
        to:   [to],
        subject,
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
