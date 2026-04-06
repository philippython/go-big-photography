import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase, fetchPackages, BRAND } from '../lib/supabase'
import { format, addDays } from 'date-fns'
import './Booking.css'

const INIT = {
  name: '', email: '', phone: '',
  package_id: '', preferred_date: '',
  location: '', outfit_notes: '', message: '', how_heard: '',
}

export default function Booking() {
  const [searchParams]          = useSearchParams()
  const [step, setStep]         = useState(1)
  const [form, setForm]         = useState({ ...INIT })
  const [errors, setErrors]     = useState({})
  const [status, setStatus]     = useState('idle')
  const [packages, setPackages] = useState([])
  const [pkgLoading, setPkgLoading] = useState(true)
  const [filter, setFilter]     = useState('all')

  // Load packages from Supabase
  useEffect(() => {
    fetchPackages().then(data => { setPackages(data); setPkgLoading(false) })
  }, [])

  // Pre-select package from URL ?package=id
  // Also resets to step 1 and scrolls to top when package param changes
  useEffect(() => {
    const pre = searchParams.get('package')
    if (pre) {
      setForm(f => ({ ...f, package_id: pre }))
      setStep(1)
      setStatus('idle')
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
    }
  }, [searchParams])

  const minDate = format(addDays(new Date(), 2), 'yyyy-MM-dd')

  // Unique category list from loaded packages
  const categories = ['all', ...new Set(packages.map(p => p.category).filter(Boolean))]
  const filtered   = filter === 'all' ? packages : packages.filter(p => p.category === filter)
  const chosen     = packages.find(p => p.id === form.package_id)

  function handle(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (errors[name]) setErrors(er => ({ ...er, [name]: '' }))
  }

  function validate() {
    const e = {}
    if (!form.package_id)   e.package_id    = 'Please select a session package'
    if (!form.name.trim())  e.name          = 'Your name is required'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                            e.email         = 'Valid email is required'
    if (!form.preferred_date) e.preferred_date = 'Please choose a preferred date'
    return e
  }

  async function submit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); setStep(2); return }

    setStatus('loading')
    const pkg = chosen
    const { error } = await supabase.from('bookings').insert([{
      ...form,
      package_name:  pkg?.name  || form.package_id,
      package_price: pkg?.price || null,
      deposit_due:   pkg?.price ? Math.round(pkg.price * 0.5) : null,
      created_at:    new Date().toISOString(),
      status:        'new',
    }])

    if (error) { console.error(error); setStatus('error') }
    else        setStatus('success')
  }

  if (status === 'success') return <BookingSuccess form={form} chosen={chosen} />

  return (
    <div className="book-page">
      <div className="book-hero">
        <div className="wrap">
          <p className="label">Book a Session</p>
          <h1 className="book-title">Let's Make It Happen</h1>
          <p className="book-sub">Choose your package, fill in your details, and we'll be in touch within 24 hours to confirm.</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="book-steps">
        <div className="wrap book-steps__inner">
          {['Choose Package', 'Your Details', 'Confirm'].map((s, i) => (
            <button
              key={i}
              className={`book-step ${step === i+1 ? 'active' : ''} ${step > i+1 ? 'done' : ''}`}
              onClick={() => { if (i + 1 < step) setStep(i + 1) }}
            >
              <span className="book-step__num">{step > i+1 ? '✓' : i+1}</span>
              <span>{s}</span>
            </button>
          ))}
        </div>
      </div>

      <form className="book-body wrap" onSubmit={submit} noValidate>

        {/* ── STEP 1: Choose Package ── */}
        {step === 1 && (
          <div className="book-step1">
            {errors.package_id && (
              <p className="field-error" style={{ marginBottom: 14 }}>{errors.package_id}</p>
            )}

            {/* Category filter */}
            <div className="pkg-filter">
              {categories.map(c => (
                <button type="button" key={c}
                  className={`pkg-filter__btn ${filter === c ? 'active' : ''}`}
                  onClick={() => setFilter(c)}
                >
                  {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
                </button>
              ))}
            </div>

            {pkgLoading ? (
              <div className="pkg-grid">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 260, borderRadius: 10 }} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="pkg-empty">No packages available right now. Check back soon!</div>
            ) : (
              <div className="pkg-grid">
                {filtered.map(pkg => (
                  <button
                    type="button"
                    key={pkg.id}
                    className={`pkg-card ${form.package_id === pkg.id ? 'active' : ''} ${pkg.popular ? 'popular' : ''}`}
                    onClick={() => setForm(f => ({ ...f, package_id: pkg.id }))}
                  >
                    {pkg.popular && <div className="pkg-card__pop">Most Popular</div>}
                    <div className="pkg-card__top">
                      <span className="pkg-card__emoji">{pkg.emoji || '📸'}</span>
                      <strong className="pkg-card__price">£{pkg.price}</strong>
                    </div>
                    <h3 className="pkg-card__name">{pkg.name}</h3>
                    <p className="pkg-card__desc">{pkg.description}</p>
                    <div className="pkg-card__pills">
                      {pkg.duration && <span>⏱ {pkg.duration}</span>}
                      {pkg.images   && <span>📷 {pkg.images} edited images</span>}
                      {pkg.outfits  && <span>👔 {pkg.outfits} outfit{pkg.outfits > 1 ? 's' : ''}</span>}
                    </div>
                    <div className={`pkg-card__select ${form.package_id === pkg.id ? 'selected' : ''}`}>
                      {form.package_id === pkg.id ? '✓ Selected' : 'Select'}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="step1-nav">
              <button type="button" className="btn-primary"
                disabled={!form.package_id}
                onClick={() => {
                  if (!form.package_id) { setErrors({ package_id: 'Please select a package' }); return }
                  setStep(2)
                }}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Details ── */}
        {step === 2 && (
          <div className="book-step2">
            <div className="book-layout">
              <div className="book-form">
                <h2>Your Details</h2>

                <div className="form-row">
                  <div className={`fg ${errors.name ? 'err' : ''}`}>
                    <label>Full Name *</label>
                    <input name="name" value={form.name} onChange={handle} placeholder="Jane Smith" />
                    {errors.name && <span className="field-error">{errors.name}</span>}
                  </div>
                  <div className={`fg ${errors.email ? 'err' : ''}`}>
                    <label>Email Address *</label>
                    <input name="email" type="email" value={form.email} onChange={handle} placeholder="jane@example.com" />
                    {errors.email && <span className="field-error">{errors.email}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="fg">
                    <label>Phone Number</label>
                    <input name="phone" value={form.phone} onChange={handle} placeholder="07700 900000" />
                  </div>
                  <div className={`fg ${errors.preferred_date ? 'err' : ''}`}>
                    <label>Preferred Date *</label>
                    <input name="preferred_date" type="date" min={minDate} value={form.preferred_date} onChange={handle} />
                    {errors.preferred_date && <span className="field-error">{errors.preferred_date}</span>}
                  </div>
                </div>

                <div className="fg">
                  <label>Shoot Location / Venue</label>
                  <input name="location" value={form.location} onChange={handle} placeholder="e.g. Shoreditch, London or specific venue" />
                </div>

                <div className="fg">
                  <label>Outfit Notes <span className="opt">(optional)</span></label>
                  <input name="outfit_notes" value={form.outfit_notes} onChange={handle} placeholder="e.g. casual look + formal suit" />
                </div>

                <div className="fg">
                  <label>Anything else? <span className="opt">(optional)</span></label>
                  <textarea name="message" rows={4} value={form.message} onChange={handle}
                    placeholder="Special requirements, ideas, or questions…" />
                </div>

                <div className="fg">
                  <label>How did you hear about us?</label>
                  <select name="how_heard" value={form.how_heard} onChange={handle}>
                    <option value="">Select…</option>
                    <option value="instagram">Instagram</option>
                    <option value="google">Google Search</option>
                    <option value="referral">Friend / Referral</option>
                    <option value="tiktok">TikTok</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="step2-nav">
                  <button type="button" className="btn-outline" onClick={() => setStep(1)}>← Back</button>
                  <button type="button" className="btn-primary" onClick={() => {
                    const errs = validate()
                    if (Object.keys(errs).length) setErrors(errs)
                    else setStep(3)
                  }}>Review Booking →</button>
                </div>
              </div>

              <BookingSidebar chosen={chosen} />
            </div>
          </div>
        )}

        {/* ── STEP 3: Confirm ── */}
        {step === 3 && (
          <div className="book-step3">
            <div className="book-layout">
              <div className="confirm-box">
                <h2>Confirm Your Booking</h2>
                <p className="confirm-note">
                  Review your details below. A <strong>50% deposit (£{chosen ? Math.round(chosen.price * 0.5) : '—'})</strong> is required via Stripe to secure your date.
                </p>

                <div className="confirm-grid">
                  <div className="confirm-item"><span>Package</span><strong>{chosen?.name}</strong></div>
                  <div className="confirm-item"><span>Total Price</span><strong>£{chosen?.price}</strong></div>
                  <div className="confirm-item"><span>Duration</span><strong>{chosen?.duration}</strong></div>
                  <div className="confirm-item"><span>Edited Images</span><strong>{chosen?.images}</strong></div>
                  <div className="confirm-item"><span>Deposit Due</span><strong className="confirm-deposit">£{chosen ? Math.round(chosen.price * 0.5) : '—'}</strong></div>
                  <div className="confirm-item"><span>Name</span><strong>{form.name}</strong></div>
                  <div className="confirm-item"><span>Email</span><strong>{form.email}</strong></div>
                  {form.phone && <div className="confirm-item"><span>Phone</span><strong>{form.phone}</strong></div>}
                  <div className="confirm-item"><span>Preferred Date</span><strong>{form.preferred_date ? format(new Date(form.preferred_date), 'd MMMM yyyy') : '—'}</strong></div>
                  {form.location && <div className="confirm-item"><span>Location</span><strong>{form.location}</strong></div>}
                </div>

                <div className="payment-info">
                  <h3>💳 How Payment Works</h3>
                  <p>After submitting, you'll receive a <strong>Stripe payment link</strong> by email to pay your deposit. Stripe supports all major cards, Apple Pay &amp; Google Pay — quick and secure. The remaining balance is due on the day.</p>
                </div>

                {status === 'error' && (
                  <div className="form-err-banner">
                    Something went wrong. Please try again or email us at {BRAND.email}
                  </div>
                )}

                <div className="step3-nav">
                  <button type="button" className="btn-outline" onClick={() => setStep(2)}>← Edit Details</button>
                  <button type="submit" className="btn-primary" disabled={status === 'loading'}>
                    {status === 'loading' ? 'Submitting…' : 'Confirm & Submit →'}
                  </button>
                </div>
              </div>

              <BookingSidebar chosen={chosen} />
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

function BookingSidebar({ chosen }) {
  return (
    <aside className="book-sidebar">
      {chosen && (
        <div className="sidebar-card selected-pkg">
          <p className="label" style={{ marginBottom: 8 }}>Selected Package</p>
          <div className="selected-pkg__row">
            <span>{chosen.emoji || '📸'} {chosen.name}</span>
            <strong>£{chosen.price}</strong>
          </div>
          <div className="selected-pkg__meta">
            {chosen.duration && <span>⏱ {chosen.duration}</span>}
            {chosen.images   && <span>📷 {chosen.images} edited images</span>}
            {chosen.outfits  && <span>👔 {chosen.outfits} outfit{chosen.outfits > 1 ? 's' : ''}</span>}
          </div>
          <div className="selected-pkg__deposit">
            Deposit: <strong>£{Math.round(chosen.price * 0.5)}</strong>
            <small> (50% to secure your date)</small>
          </div>
        </div>
      )}

      <div className="sidebar-card">
        <h4>What happens next?</h4>
        <ol className="sidebar-steps">
          <li><span>01</span><div><strong>We confirm</strong><p>Hear from us within 24 hours to confirm availability.</p></div></li>
          <li><span>02</span><div><strong>Pay deposit via Stripe</strong><p>Secure Stripe link sent by email — all cards, Apple &amp; Google Pay.</p></div></li>
          <li><span>03</span><div><strong>48hr reminder</strong><p>Email reminder sent before your session with everything you need.</p></div></li>
          <li><span>04</span><div><strong>Shoot day!</strong><p>Arrive, relax, and let us do the rest.</p></div></li>
        </ol>
      </div>

      <div className="sidebar-card sidebar-contact">
        <h4>Questions?</h4>
        <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>
        <a href={`tel:${BRAND.phone}`}>{BRAND.phone}</a>
      </div>
    </aside>
  )
}

function BookingSuccess({ form, chosen }) {
  return (
    <div className="book-page">
      <div className="book-success">
        <div className="wrap book-success__inner">
          <div className="success-icon">✓</div>
          <p className="label">Booking Received</p>
          <h1>You're All Set, {form.name.split(' ')[0]}!</h1>
          <p className="success-msg">
            We'll be in touch within 24 hours at <strong>{form.email}</strong> to confirm your session and send your Stripe deposit link.
          </p>
          {chosen && (
            <div className="success-pkg">
              <div>{chosen.emoji || '📸'} <strong>{chosen.name}</strong></div>
              <div>Preferred Date: <strong>{form.preferred_date ? format(new Date(form.preferred_date), 'd MMMM yyyy') : '—'}</strong></div>
              <div>Total: <strong>£{chosen.price}</strong> · Deposit: <strong>£{Math.round(chosen.price * 0.5)}</strong></div>
            </div>
          )}
          <div className="success-reminder">
            <span>🔔</span>
            <p>You'll receive an automated <strong>reminder 48 hours before</strong> your session with everything you need to know.</p>
          </div>
          <a href="/" className="btn-primary" style={{ marginTop: 8 }}>Back to Home</a>
        </div>
      </div>
    </div>
  )
}