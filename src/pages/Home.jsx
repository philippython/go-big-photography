import { Link } from 'react-router-dom'
import { BRAND, PACKAGES } from '../lib/supabase'
import './Home.css'

const WHY = [
  { icon: '🎯', title: 'Expert Posing Guidance',   desc: 'No experience needed — you\'ll be directed every step of the way for natural, confident results.' },
  { icon: '✨', title: 'High-End Retouching',       desc: 'Clean, modern edits with professional retouching included in every package.' },
  { icon: '⚡', title: 'Fast Turnaround',           desc: '3–7 days for studio sessions, 7–14 days for events. Delivered via private gallery link.' },
  { icon: '📍', title: 'London Based',              desc: 'Studio & on-location shoots across London. Available UK-wide for weddings and events.' },
]

const FEATURED = [
  { id: 'elite-portrait', badge: '🔥 Most Popular' },
  { id: 'elite-family',   badge: '❤️ Perfect for Families' },
  { id: 'elite-street',   badge: '🏙️ Bold & Creative' },
]

export default function Home() {
  const featured = FEATURED.map(f => ({
    ...PACKAGES.find(p => p.id === f.id),
    badge: f.badge,
  }))

  return (
    <div className="home">

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero__noise" />
        <div className="hero__glow" />
        <div className="hero__content wrap">
          <div className="hero__eyebrow fu">
            <span className="hero__dot" />
            <span className="label">London-Based Photography Studio</span>
          </div>
          <h1 className="hero__h1 fu1">
            Go Big.<br />
            <span className="hero__accent">Or Go Home.</span>
          </h1>
          <p className="hero__sub fu2">
            Bold, powerful, unforgettable photography for portraits, families, maternity, events & beyond.
            <br />Capturing your story — at scale.
          </p>
          <div className="hero__actions fu3">
            <Link to="/booking" className="btn-primary">Book a Session</Link>
            <Link to="/catalogue" className="btn-outline">View Portfolio</Link>
          </div>
          <div className="hero__stats fu4">
            <div className="hero__stat">
              <strong>5+</strong><span>Years Experience</span>
            </div>
            <div className="hero__divider" />
            <div className="hero__stat">
              <strong>500+</strong><span>Happy Clients</span>
            </div>
            <div className="hero__divider" />
            <div className="hero__stat">
              <strong>8</strong><span>Session Types</span>
            </div>
          </div>
        </div>
        <div className="hero__scroll">
          <span>scroll</span>
          <div className="hero__scroll-line" />
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="marquee">
        <div className="marquee__track">
          {['Weddings','Portraits','Family','Maternity','Street','Events','Commercial','Branding',
            'Weddings','Portraits','Family','Maternity','Street','Events','Commercial','Branding'].map((t,i) => (
            <span key={i}>{t} <em>◆</em></span>
          ))}
        </div>
      </div>

      {/* ── FEATURED PACKAGES ── */}
      <section className="feat-section">
        <div className="wrap">
          <div className="section-head">
            <p className="label">Popular Packages</p>
            <h2 className="section-title">Choose Your Session</h2>
            <p className="section-sub">From quick portraits to immersive elite sessions — every package includes professional editing and expert guidance.</p>
          </div>
          <div className="feat-grid">
            {featured.map(pkg => (
              <div key={pkg.id} className="feat-card">
                <div className="feat-card__badge">{pkg.badge}</div>
                <div className="feat-card__emoji">{pkg.emoji}</div>
                <h3>{pkg.name}</h3>
                <p>{pkg.desc}</p>
                <div className="feat-card__meta">
                  <span>⏱ {pkg.duration}</span>
                  <span>📷 {pkg.images} edited images</span>
                  <span>👔 {pkg.outfits} outfit{pkg.outfits > 1 ? 's' : ''}</span>
                </div>
                <div className="feat-card__footer">
                  <strong className="feat-card__price">£{pkg.price}</strong>
                  <Link to={`/booking?package=${pkg.id}`} className="btn-primary">Book This</Link>
                </div>
              </div>
            ))}
          </div>
          <div className="feat-cta">
            <Link to="/booking" className="btn-outline">See All 8 Packages →</Link>
          </div>
        </div>
      </section>

      {/* ── WHY US ── */}
      <section className="why-section">
        <div className="wrap why-inner">
          <div className="why-left">
            <p className="label">Why GoBig</p>
            <h2 className="section-title">The GoBig Difference</h2>
            <p className="section-sub" style={{ textAlign:'left', maxWidth: 400 }}>
              Every session is crafted to make you feel at ease, look your best, and leave with images that truly represent who you are.
            </p>
            <div className="why-photographer">
              <div className="why-photographer__avatar">
                <span>GO</span>
              </div>
              <div>
                <strong>Gbolahan Ogundipe</strong>
                <span>Lead Photographer · 5 Years Experience</span>
              </div>
            </div>
            <Link to="/booking" className="btn-primary" style={{ marginTop: 8, alignSelf: 'flex-start' }}>
              Work With Me
            </Link>
          </div>
          <div className="why-grid">
            {WHY.map((w, i) => (
              <div key={i} className="why-card">
                <span className="why-card__icon">{w.icon}</span>
                <h4>{w.title}</h4>
                <p>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA STRIP ── */}
      <section className="cta-strip">
        <div className="cta-strip__noise" />
        <div className="wrap cta-strip__inner">
          <div>
            <h2>Let's create something powerful, stylish &amp; uniquely yours.</h2>
            <p>Based in London · Available UK-wide · <a href={`tel:${BRAND.phone}`}>{BRAND.phone}</a></p>
          </div>
          <div className="cta-strip__actions">
            <Link to="/booking"   className="btn-primary">Book Now</Link>
            <Link to="/catalogue" className="btn-outline">View Portfolio</Link>
          </div>
        </div>
      </section>

    </div>
  )
}
