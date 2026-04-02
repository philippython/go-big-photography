import './Terms.css'
import { BRAND } from '../lib/supabase'

const SECTIONS = [
  {
    num: '01',
    title: 'Booking & Payment',
    content: `A non-refundable deposit of 50% of the agreed session fee is required to secure all bookings — whether studio or on-location. No date is confirmed until the deposit has been received. The remaining balance must be paid in full before or on the day of the session or event. For weddings and large-scale events, full payment may be required 48–72 hours in advance. Payment is processed securely via Stripe (supporting all major cards, Apple Pay, and Google Pay).`,
  },
  {
    num: '02',
    title: 'Cancellations & Rescheduling',
    content: `All deposits are non-refundable but may be transferred to a future booking on one occasion, subject to availability. Studio session rescheduling requires a minimum of 48 hours' notice. For weddings and events, at least 7 days' notice is required to reschedule. Late cancellations or no-shows will result in the loss of all payments made. Where a client cancels entirely without rescheduling, the deposit is forfeited regardless of notice given.`,
  },
  {
    num: '03',
    title: 'Arrival & Timing',
    content: `Clients are expected to arrive punctually for studio sessions. For events and on-location shoots, the photographer will arrive at the agreed time and location. Any delays caused by the client may reduce the session duration and affect the final deliverables. If a session runs beyond the agreed time due to client actions, additional charges may apply at a rate agreed at the time of booking.`,
  },
  {
    num: '04',
    title: 'Image Delivery',
    content: `Edited images will be delivered within 3–7 working days for studio sessions and 7–14 working days for events, weddings, or complex shoots. All images are delivered via a private online gallery or secure download link sent to the client's registered email. Raw, unedited images are not provided under any circumstances. A minimum of 2 weeks should be allowed for image preparation before any intended use (e.g. printed materials, events). Minor re-editing requests may be accommodated within 14 days of gallery delivery.`,
  },
  {
    num: '05',
    title: 'Editing Style',
    content: `By booking a session, the client agrees to the photographer's creative style and editing approach. GoBig Photography delivers clean, high-quality, modern edits consistent with our portfolio. Standard retouching is included in all packages. Advanced retouching or significant compositional alterations may attract an additional fee and must be agreed in advance.`,
  },
  {
    num: '06',
    title: 'Copyright & Usage Rights',
    content: `All images produced during a session remain the intellectual property of GoBig Photography and the photographer Gbolahan Ogundipe. Clients are granted a personal, non-exclusive licence to use the delivered images for personal, non-commercial purposes — including sharing on personal social media accounts and printing for private use. Images must not be altered with filters, sold, sub-licensed, or passed to third parties for commercial use without prior written consent. Any commercial licensing is subject to a separate agreement and fee.`,
  },
  {
    num: '07',
    title: 'Portfolio & Promotion',
    content: `GoBig Photography reserves the right to use images produced during any session for portfolio, website, social media, and marketing purposes. Clients who wish to opt out of this must submit a written request to the photographer before the session or event takes place. Opting out does not affect the price or quality of the service.`,
  },
  {
    num: '08',
    title: 'Client Responsibility & Conduct',
    content: `Clients are responsible for ensuring a safe, respectful, and cooperative environment throughout the session or event. The photographer reserves the right to cease work immediately if conditions become unsafe, abusive, or inappropriate — in which case all payments made will be forfeited. Clients are also responsible for the conduct of any guests or subjects present at the shoot.`,
  },
  {
    num: '09',
    title: 'Damage to Equipment',
    content: `Clients are fully responsible for any damage to photography equipment caused by themselves, their children, guests, or anyone present at the session at their invitation. The client agrees to pay the full cost of repair or replacement, as well as any loss of income arising from equipment downtime. This applies regardless of whether the damage was accidental.`,
  },
  {
    num: '10',
    title: 'Liability',
    content: `GoBig Photography carries professional public liability insurance. In the event of equipment failure, serious illness, or circumstances genuinely beyond the photographer's reasonable control that prevent delivery of the service, liability shall be limited to a full refund of all fees paid. The photographer shall not be liable for indirect losses, loss of enjoyment, or consequential damages of any kind.`,
  },
  {
    num: '11',
    title: 'Outdoor & Weather Conditions',
    content: `GoBig Photography is not responsible for adverse weather or environmental conditions affecting outdoor shoots. In cases of severe weather, both parties agree to act in good faith to reschedule. The photographer will not issue refunds solely on the basis of weather unless the session is entirely impossible to conduct safely.`,
  },
  {
    num: '12',
    title: 'Data Protection',
    content: `Personal data collected through bookings is processed in accordance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018. Data is used solely for session management and communication purposes and will not be shared with third parties without consent. Clients may request access to, correction of, or deletion of their personal data by contacting us directly.`,
  },
  {
    num: '13',
    title: 'Governing Law',
    content: `These Terms and Conditions are governed by and construed in accordance with the laws of England and Wales. Any disputes arising shall be subject to the exclusive jurisdiction of the courts of England and Wales.`,
  },
  {
    num: '14',
    title: 'Agreement',
    content: `By proceeding with a booking — whether verbally, in writing, or via our online booking form — the client confirms they have read, understood, and agreed to these Terms and Conditions in full. These terms apply to all services provided by GoBig Photography Studio.`,
  },
]

export default function Terms() {
  return (
    <div className="terms-page">
      <div className="terms-hero">
        <div className="wrap">
          <p className="label">Legal</p>
          <h1 className="terms-title">Terms &amp; Conditions</h1>
          <p className="terms-sub">Photography Studio &amp; Client Agreement — GoBig Photography Studio. Please read carefully before booking.</p>
          <div className="terms-meta">
            <span>Photographer: <strong>{BRAND.photographer}</strong></span>
            <span>Location: <strong>{BRAND.location}</strong></span>
            <span>Last updated: <strong>January 2025</strong></span>
          </div>
        </div>
      </div>

      <div className="terms-body wrap">
        <aside className="terms-nav">
          <p className="terms-nav__label">Contents</p>
          {SECTIONS.map(s => (
            <a key={s.num} href={`#s${s.num}`} className="terms-nav__link">
              <span>{s.num}</span> {s.title}
            </a>
          ))}
        </aside>

        <div className="terms-content">
          {SECTIONS.map(s => (
            <section key={s.num} id={`s${s.num}`} className="terms-section">
              <div className="terms-section__num">{s.num}</div>
              <h2>{s.title}</h2>
              <p>{s.content}</p>
            </section>
          ))}

          <div className="terms-contact-card">
            <h3>Questions about these terms?</h3>
            <p>Get in touch before booking if you have any concerns — we're happy to clarify anything.</p>
            <div className="terms-contact-card__links">
              <a href={`mailto:${BRAND.email}`} className="btn-primary">Email Us</a>
              <a href={`tel:${BRAND.phone}`} className="btn-outline">{BRAND.phone}</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
