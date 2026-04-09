// ─────────────────────────────────────────────────────────────
// GoBig Photography — Email Templates
// Used by: src/pages/Booking.jsx (booking confirm + notify)
//          src/pages/Admin.jsx   (deposit link email)
//          Supabase Edge Function: booking-reminder (reminder)
// ─────────────────────────────────────────────────────────────

// ── Shared helpers ────────────────────────────────────────────

function row(label, value, valueColor = '#ccc') {
  if (!value || value === '—') return ''
  return `
    <tr style="border-bottom:1px solid #2a2a2a">
      <td style="padding:10px 0;color:#666;font-size:13px;width:140px;vertical-align:top">${label}</td>
      <td style="padding:10px 0;color:${valueColor};font-size:14px;font-weight:600">${value}</td>
    </tr>`
}

function lightRow(label, value) {
  if (!value || value === '—') return ''
  return `
    <tr style="border-bottom:1px solid #eee">
      <td style="padding:9px 0;color:#888;font-size:13px;width:130px;vertical-align:top">${label}</td>
      <td style="padding:9px 0;color:#111;font-size:14px;font-weight:600">${value}</td>
    </tr>`
}

function step(num, color, title, desc) {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px">
      <tr>
        <td style="width:36px;vertical-align:top;padding-top:2px">
          <div style="width:28px;height:28px;background:${color};border-radius:50%;text-align:center;line-height:28px;font-size:12px;font-weight:800;color:#000">${num}</div>
        </td>
        <td style="padding-left:12px">
          <p style="margin:0 0 3px;color:#111;font-size:14px;font-weight:700">${title}</p>
          <p style="margin:0;color:#666;font-size:13px;line-height:1.5">${desc}</p>
        </td>
      </tr>
    </table>`
}

function checklist(items) {
  return items.map(item => `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px">
      <tr>
        <td style="width:24px;vertical-align:top;color:#f59e0b;font-size:16px;font-weight:700">✓</td>
        <td style="color:#444;font-size:14px;line-height:1.5;padding-left:8px">${item}</td>
      </tr>
    </table>`).join('')
}

function header(emoji, subtitle, dark = false) {
  return `
    <tr>
      <td style="background:linear-gradient(135deg,#0a0a0a,#1a1200);border-radius:16px 16px 0 0;padding:48px 40px 40px;text-align:center">
        <div style="display:inline-block;background:#f59e0b;border-radius:50%;width:72px;height:72px;line-height:72px;text-align:center;font-size:32px;margin-bottom:20px;box-shadow:0 0 30px rgba(245,158,11,0.4)">${emoji}</div>
        <h1 style="margin:0 0 8px;color:#f59e0b;font-size:30px;font-weight:800;letter-spacing:1px">GOBIG PHOTOGRAPHY</h1>
        <p style="margin:0;color:#888;font-size:13px;letter-spacing:3px;text-transform:uppercase">${subtitle}</p>
      </td>
    </tr>`
}

function footer() {
  return `
    <tr>
      <td style="background:#0a0a0a;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center">
        <p style="margin:0 0 4px;color:#f59e0b;font-size:13px;font-weight:700">GoBig Photography Studio</p>
        <p style="margin:0;color:#555;font-size:12px">London, United Kingdom · 07903987131 · Hellogobigphotography@gmail.com</p>
      </td>
    </tr>`
}

function wrap(rows) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 20px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
        ${rows}
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─────────────────────────────────────────────────────────────
// 1. BOOKING NOTIFICATION — sent to photographer on new booking
//    EmailJS template: booking_notify
//    To: Hellogobigphotography@gmail.com
// ─────────────────────────────────────────────────────────────
export function bookingNotifyHTML({
  client_name, client_email, client_phone,
  package_name, package_price, deposit_due,
  preferred_date, location, outfit_notes,
  message, how_heard,
}) {
  return wrap(`
    <tr>
      <td style="background:linear-gradient(135deg,#1a1a1a 0%,#2a1f00 100%);border-radius:16px 16px 0 0;padding:40px 40px 32px;text-align:center;border:1px solid #333;border-bottom:none">
        <div style="display:inline-block;background:#f59e0b;border-radius:50%;width:64px;height:64px;line-height:64px;text-align:center;font-size:28px;margin-bottom:16px">📸</div>
        <h1 style="margin:0 0 6px;color:#f59e0b;font-size:28px;font-weight:800;letter-spacing:1px">GOBIG PHOTOGRAPHY</h1>
        <p style="margin:0;color:#888;font-size:13px;letter-spacing:3px;text-transform:uppercase">New Booking Alert</p>
      </td>
    </tr>
    <tr>
      <td style="background:#f59e0b;padding:14px 40px;border-left:1px solid #f59e0b;border-right:1px solid #f59e0b">
        <p style="margin:0;color:#000;font-size:15px;font-weight:700;text-align:center">🔥 New booking from ${client_name}</p>
      </td>
    </tr>
    <tr>
      <td style="background:#1a1a1a;padding:36px 40px;border:1px solid #333;border-top:none;border-bottom:none">
        <h2 style="margin:0 0 16px;color:#fff;font-size:16px;font-weight:700;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #333;padding-bottom:12px">👤 Client Details</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
          ${row('Name', client_name, '#fff')}
          ${row('Email', client_email, '#f59e0b')}
          ${row('Phone', client_phone)}
          ${row('How Found Us', how_heard)}
        </table>
        <h2 style="margin:0 0 16px;color:#fff;font-size:16px;font-weight:700;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #333;padding-bottom:12px">📦 Booking Details</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
          ${row('Package', package_name, '#fff')}
          ${row('Total Price', '£' + package_price, '#f59e0b')}
          ${row('Preferred Date', preferred_date, '#fff')}
          ${row('Location', location)}
          ${row('Outfit Notes', outfit_notes)}
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:${message && message !== '—' ? '24px' : '0'}">
          <tr>
            <td style="background:linear-gradient(135deg,#2a1f00,#1a1a1a);border:1px solid #f59e0b;border-radius:12px;padding:20px 24px">
              <p style="margin:0 0 6px;color:#f59e0b;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Deposit Due</p>
              <p style="margin:0;color:#fff;font-size:32px;font-weight:800">£${deposit_due}</p>
              <p style="margin:4px 0 0;color:#888;font-size:13px">Send Stripe payment link to collect this</p>
            </td>
          </tr>
        </table>
        ${message && message !== '—' ? `
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td>
            <h2 style="margin:0 0 12px;color:#fff;font-size:16px;font-weight:700;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #333;padding-bottom:12px">💬 Client Message</h2>
            <p style="margin:0;color:#ccc;font-size:15px;line-height:1.7;background:#111;padding:16px;border-radius:8px;border-left:3px solid #f59e0b">${message}</p>
          </td></tr>
        </table>` : ''}
      </td>
    </tr>
    <tr>
      <td style="background:#111;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;border:1px solid #333;border-top:2px solid #f59e0b">
        <p style="margin:0 0 4px;color:#f59e0b;font-size:13px;font-weight:700">GoBig Photography Studio</p>
        <p style="margin:0;color:#555;font-size:12px">London, UK · 07903987131 · Hellogobigphotography@gmail.com</p>
      </td>
    </tr>
  `)
}

// ─────────────────────────────────────────────────────────────
// 2. BOOKING CONFIRMATION — sent to client on new booking
//    EmailJS template: booking_confirm
//    To: {{to_email}} (client email)
// ─────────────────────────────────────────────────────────────
export function bookingConfirmHTML({
  client_name, package_name, package_price,
  deposit_due, preferred_date, location,
}) {
  const firstName = (client_name || 'there').split(' ')[0]
  const remaining = package_price && deposit_due
    ? Number(package_price) - Number(deposit_due)
    : '—'
  return wrap(`
    ${header('📸', 'Booking Confirmed')}
    <tr>
      <td style="background:#f59e0b;padding:28px 40px;text-align:center">
        <h2 style="margin:0 0 8px;color:#000;font-size:24px;font-weight:800">Your date is secured, ${firstName}! 🎉</h2>
        <p style="margin:0;color:#333;font-size:15px">Your deposit has been paid and your booking is confirmed.</p>
      </td>
    </tr>
    <tr>
      <td style="background:#fff;padding:40px;border-left:1px solid #eee;border-right:1px solid #eee">

        <!-- DEPOSIT PAID BADGE -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
          <tr>
            <td style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:2px solid #16a34a;border-radius:12px;padding:20px 24px;text-align:center">
              <p style="margin:0 0 4px;color:#15803d;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase">✅ Deposit Paid</p>
              <p style="margin:0;color:#000;font-size:32px;font-weight:900">£${deposit_due}</p>
              <p style="margin:6px 0 0;color:#555;font-size:13px">Your date is now secured. Remaining balance of £${remaining} is due on the day.</p>
            </td>
          </tr>
        </table>

        <!-- BOOKING SUMMARY -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:12px;margin-bottom:28px;overflow:hidden;border:1px solid #eee">
          <tr><td style="background:#0a0a0a;padding:14px 20px">
            <p style="margin:0;color:#f59e0b;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Your Booking Summary</p>
          </td></tr>
          <tr><td style="padding:20px">
            <table width="100%" cellpadding="0" cellspacing="0">
              ${lightRow('Package', package_name)}
              ${lightRow('Total Price', '£' + package_price)}
              ${lightRow('Session Date', preferred_date)}
              ${location && location !== '—' ? lightRow('Location', location) : ''}
            </table>
          </td></tr>
        </table>

        <!-- WHAT HAPPENS NEXT -->
        <h3 style="margin:0 0 16px;color:#111;font-size:15px;font-weight:700;text-transform:uppercase;letter-spacing:1px">What happens next</h3>
        ${step('01', '#f59e0b', 'Check your inbox', 'We may reach out to confirm final details about your session.')}
        ${step('02', '#f59e0b', 'Automated reminder coming', "You'll receive a reminder email before your session with everything you need to know.")}
        ${step('03', '#f59e0b', 'Arrive & enjoy', 'On the day, just show up relaxed — we handle everything.')}
        ${step('04', '#f59e0b', 'Receive your gallery', 'Edited images delivered within 3–7 days for studio sessions, 7–14 days for events.')}

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:12px;border:1px solid #eee;margin-top:24px">
          <tr><td style="padding:20px">
            <p style="margin:0 0 10px;color:#111;font-size:14px;font-weight:700">Any questions?</p>
            <p style="margin:0 0 6px;color:#555;font-size:14px">📞 <a href="tel:07903987131" style="color:#f59e0b;text-decoration:none;font-weight:600">07903987131</a></p>
            <p style="margin:0;color:#555;font-size:14px">✉️ <a href="mailto:Hellogobigphotography@gmail.com" style="color:#f59e0b;text-decoration:none;font-weight:600">Hellogobigphotography@gmail.com</a></p>
          </td></tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="background:#fff;padding:0 40px 32px;border-left:1px solid #eee;border-right:1px solid #eee">
        <p style="margin:0 0 4px;color:#111;font-size:15px">Can't wait to create something amazing with you!</p>
        <p style="margin:0;color:#111;font-size:15px;font-weight:700">— Gbolahan<br/>GoBig Photography</p>
      </td>
    </tr>
    ${footer()}
  `)
}

// ─────────────────────────────────────────────────────────────
// 3. SESSION REMINDER — sent automatically 48hrs before shoot
//    OR morning of shoot if booked last minute
//    Used by: Supabase Edge Function booking-reminder (Brevo)
//    NOTE: This function is also exported for use in the
//    Edge Function via a shared copy — see instructions below
// ─────────────────────────────────────────────────────────────
export function reminderHTML({
  client_name, package_name, preferred_date,
  location, outfit_notes, is_morning_of = false,
}) {
  const firstName = (client_name || 'there').split(' ')[0]
  const heroText  = is_morning_of
    ? `Good morning ${firstName} — it's shoot day! 🌅`
    : `See you tomorrow, ${firstName}! 📸`
  const heroSub   = is_morning_of
    ? 'Your GoBig Photography session is TODAY. Here\'s everything you need.'
    : 'Your photography session is tomorrow — here\'s everything you need.'

  return wrap(`
    ${header('⏰', is_morning_of ? 'Shoot Day!' : 'Session Reminder')}
    <tr>
      <td style="background:#f59e0b;padding:28px 40px;text-align:center">
        <h2 style="margin:0 0 8px;color:#000;font-size:24px;font-weight:800">${heroText}</h2>
        <p style="margin:0;color:#333;font-size:15px">${heroSub}</p>
      </td>
    </tr>
    <tr>
      <td style="background:#fff;padding:40px;border-left:1px solid #eee;border-right:1px solid #eee">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:12px;margin-bottom:28px;overflow:hidden;border:1px solid #eee">
          <tr><td style="background:#0a0a0a;padding:14px 20px">
            <p style="margin:0;color:#f59e0b;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase">${is_morning_of ? "Today's" : "Tomorrow's"} Session</p>
          </td></tr>
          <tr><td style="padding:20px">
            <table width="100%" cellpadding="0" cellspacing="0">
              ${lightRow('Package', package_name)}
              ${lightRow('Date', preferred_date)}
              ${lightRow('Location', location || 'To be confirmed')}
              ${outfit_notes && outfit_notes !== '—' ? lightRow('Outfits', outfit_notes) : ''}
            </table>
          </td></tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
          <tr>
            <td style="background:linear-gradient(135deg,#fff8ed,#fff3d6);border:2px solid #f59e0b;border-radius:12px;padding:24px">
              <h3 style="margin:0 0 16px;color:#92400e;font-size:14px;font-weight:700;letter-spacing:1px;text-transform:uppercase">✅ What to bring</h3>
              ${checklist([
                outfit_notes && outfit_notes !== '—' ? `Your outfits — ${outfit_notes}` : 'Your outfit(s)',
                'Any props or accessories you discussed',
                'Water bottle — especially for outdoor shoots',
                'Yourself — relaxed and ready to go!',
              ])}
            </td>
          </tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
          <tr>
            <td>
              <h3 style="margin:0 0 16px;color:#111;font-size:14px;font-weight:700;letter-spacing:1px;text-transform:uppercase">💡 Quick tips for great photos</h3>
              ${checklist([
                is_morning_of ? 'Have a good breakfast and stay hydrated' : 'Get a good night\'s sleep tonight',
                'Arrive 5–10 minutes early to settle in',
                "Don't worry about posing — we'll guide you every step",
                'Bring options if you\'re unsure about outfits',
              ])}
            </td>
          </tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:12px;border:1px solid #eee">
          <tr><td style="padding:20px">
            <p style="margin:0 0 10px;color:#111;font-size:14px;font-weight:700">Last minute questions?</p>
            <p style="margin:0 0 6px;color:#555;font-size:14px">📞 <a href="tel:07903987131" style="color:#f59e0b;text-decoration:none;font-weight:600">07903987131</a></p>
            <p style="margin:0;color:#555;font-size:14px">✉️ <a href="mailto:Hellogobigphotography@gmail.com" style="color:#f59e0b;text-decoration:none;font-weight:600">Hellogobigphotography@gmail.com</a></p>
          </td></tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="background:#fff;padding:0 40px 32px;border-left:1px solid #eee;border-right:1px solid #eee">
        <p style="margin:0 0 4px;color:#111;font-size:15px">${is_morning_of ? "Can't wait to see you today!" : "Can't wait to see you tomorrow!"}</p>
        <p style="margin:0;color:#111;font-size:15px;font-weight:700">— Gbolahan<br/>GoBig Photography</p>
      </td>
    </tr>
    ${footer()}
  `)
}

// ─────────────────────────────────────────────────────────────
// 4. DEPOSIT PAYMENT LINK — sent from admin when Stripe link ready
//    Used by: src/pages/Admin.jsx → sendDepositEmail()
// ─────────────────────────────────────────────────────────────
export function depositHTML({
  client_name, package_name, package_price,
  deposit_due, stripe_link,
}) {
  const firstName = (client_name || 'there').split(' ')[0]
  const remaining = package_price && deposit_due
    ? Number(package_price) - Number(deposit_due)
    : null

  return wrap(`
    ${header('💳', 'Deposit Payment')}
    <tr>
      <td style="background:#f59e0b;padding:28px 40px;text-align:center">
        <h2 style="margin:0 0 8px;color:#000;font-size:24px;font-weight:800">Secure your date, ${firstName}! 🎯</h2>
        <p style="margin:0;color:#333;font-size:15px">Pay your deposit to confirm your booking with GoBig Photography.</p>
      </td>
    </tr>
    <tr>
      <td style="background:#fff;padding:40px;border-left:1px solid #eee;border-right:1px solid #eee">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:12px;margin-bottom:28px;overflow:hidden;border:1px solid #eee">
          <tr><td style="background:#0a0a0a;padding:14px 20px">
            <p style="margin:0;color:#f59e0b;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Booking Summary</p>
          </td></tr>
          <tr><td style="padding:20px">
            <table width="100%" cellpadding="0" cellspacing="0">
              ${lightRow('Package', package_name)}
              ${lightRow('Total Price', '£' + package_price)}
              ${remaining ? lightRow('Remaining (due on day)', '£' + remaining) : ''}
            </table>
          </td></tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
          <tr>
            <td style="background:linear-gradient(135deg,#fff8ed,#fff3d6);border:2px solid #f59e0b;border-radius:16px;padding:32px;text-align:center">
              <p style="margin:0 0 6px;color:#92400e;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Deposit Amount</p>
              <p style="margin:0 0 20px;color:#000;font-size:48px;font-weight:900;line-height:1">£${deposit_due}</p>
              <a href="${stripe_link}"
                style="display:inline-block;background:#000;color:#f59e0b;padding:16px 40px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:800;letter-spacing:0.5px">
                Pay Now →
              </a>
              <p style="margin:16px 0 0;color:#666;font-size:13px">Secure payment via Stripe · All cards, Apple Pay &amp; Google Pay</p>
            </td>
          </tr>
        </table>
        ${step('01', '#f59e0b', 'Your date is secured', 'Once the deposit is received your booking is confirmed.')}
        ${step('02', '#f59e0b', 'Reminder sent before your session', "We'll email you before your shoot with everything you need.")}
        ${remaining ? step('03', '#f59e0b', `Remaining balance on the day`, `£${remaining} is due on the day of your session.`) : ''}
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:12px;border:1px solid #eee;margin-top:24px">
          <tr><td style="padding:20px">
            <p style="margin:0 0 10px;color:#111;font-size:14px;font-weight:700">Questions?</p>
            <p style="margin:0 0 6px;color:#555;font-size:14px">📞 <a href="tel:07903987131" style="color:#f59e0b;text-decoration:none;font-weight:600">07903987131</a></p>
            <p style="margin:0;color:#555;font-size:14px">✉️ <a href="mailto:Hellogobigphotography@gmail.com" style="color:#f59e0b;text-decoration:none;font-weight:600">Hellogobigphotography@gmail.com</a></p>
          </td></tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="background:#fff;padding:0 40px 32px;border-left:1px solid #eee;border-right:1px solid #eee">
        <p style="margin:0;color:#111;font-size:15px;font-weight:700">— Gbolahan<br/>GoBig Photography</p>
      </td>
    </tr>
    ${footer()}
  `)
}