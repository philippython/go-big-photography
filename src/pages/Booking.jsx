import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase, fetchPackages, BRAND } from '../lib/supabase'
import { format, addDays } from 'date-fns'
import emailjs from '@emailjs/browser'
import StripeCheckout from '../components/StripeCheckout'
import { bookingConfirmHTML } from '../lib/emailTemplates'
import DatePicker from '../components/DatePicker'
import './Booking.css'

const EMAILJS_SERVICE_ID       = import.meta.env.VITE_EMAILJS_SERVICE_ID
const EMAILJS_CONFIRM_TEMPLATE = import.meta.env.VITE_EMAILJS_CONFIRM_TEMPLATE
const EMAILJS_PUBLIC_KEY       = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

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
  const [savedBooking, setSavedBooking]   = useState(null)
  const [bookedDates, setBookedDates]     = useState([])

  useEffect(() => {
    fetchPackages().then(data => { setPackages(data); setPkgLoading(false) })
    // Fetch all booked dates to disable them in the date picker
    supabase
      .from('bookings')
      .select('preferred_date')
      .not('preferred_date', 'is', null)
      .not('status', 'in', '(cancelled,declined)')
      .then(({ data }) => {
        if (data) setBookedDates(data.map(b => b.preferred_date))
      })
  }, [])

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
    if (!form.package_id)   e.package_id     = 'Please select a session package'
    if (!form.name.trim())  e.name           = 'Your name is required'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                            e.email          = 'Valid email is required'
    if (!form.preferred_date) e.preferred_date = 'Please choose a preferred date'
    return e
  }

  async function sendConfirmEmail(pkg) {
    const data = {
      client_name:    form.name,
      client_email:   form.email,
      package_name:   pkg?.name  || form.package_id,
      package_price:  pkg?.price || '—',
      deposit_due:    pkg?.price ? Math.round(pkg.price * 0.5) : '—',
      preferred_date: form.preferred_date
        ? format(new Date(form.preferred_date), 'd MMMM yyyy')
        : '—',
      location:       form.location || '—',
    }

    try {
      // Send booking confirmation to client only
      // NOTE: In your EmailJS template, set the "To Email" field to {{to_email}}
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_CONFIRM_TEMPLATE,
        {
          // Recipient — must match your EmailJS template "To Email" field exactly
          to_email:       data.client_email,
          to_name:        data.client_name,
          reply_to:       data.client_email,
          // Content
          subject:        `Booking received — GoBig Photography`,
          html_body:      bookingConfirmHTML(data),
          // Plain text fallbacks
          client_name:    data.client_name,
          client_email:   data.client_email,
          package_name:   data.package_name,
          package_price:  data.package_price,
          deposit_due:    data.deposit_due,
          preferred_date: data.preferred_date,
          location:       data.location,
        },
        EMAILJS_PUBLIC_KEY
      )
      console.log('Confirmation email sent to', data.client_email)
      return true
    } catch (err) {
      console.error('EmailJS confirm error:', err.text || err.message || err)
      return false
    }
  }

  async function submit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); setStep(2); return }

    setStatus('loading')
    const pkg = chosen

    // Save booking to Supabase
    const { error } = await supabase.from('bookings').insert([{
      ...form,
      package_name:  pkg?.name  || form.package_id,
      package_price: pkg?.price || null,
      deposit_due:   pkg?.price ? Math.round(pkg.price * 0.5) : null,
      created_at:    new Date().toISOString(),
      status:        'new',
    }])

    if (error) {
      console.error(error)
      setStatus('error')
      return
    }

    // Get the saved booking id for Stripe metadata
    const { data: saved } = await supabase
      .from('bookings')
      .select('id')
      .eq('email', form.email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()  // won't throw 406 if row not found

    setSavedBooking(saved || {})
    setStatus('payment') // go to payment step
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

      <div className="book-steps">
        <div className="wrap book-steps__inner">
          {['Choose Package', 'Your Details', 'Confirm', 'Pay Deposit'].map((s, i) => (
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

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div className="book-step1">
            {errors.package_id && (
              <p className="field-error" style={{ marginBottom: 14 }}>{errors.package_id}</p>
            )}

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
              <div className="pkg-empty">No packages available right now.</div>
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

        {/* ── STEP 2 ── */}
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
                    <DatePicker
                      value={form.preferred_date}
                      onChange={(date) => {
                        setForm(f => ({ ...f, preferred_date: date }))
                        if (errors.preferred_date) setErrors(e => ({ ...e, preferred_date: '' }))
                      }}
                      bookedDates={bookedDates}
                      minDaysAhead={2}
                    />
                    {errors.preferred_date && <span className="field-error" style={{ marginTop: 4 }}>{errors.preferred_date}</span>}
                  </div>
                </div>

                <div className="fg">
                  <label>Shoot Location / Venue</label>
                  <input name="location" value={form.location} onChange={handle} placeholder="e.g. Shoreditch, London" />
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

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <div className="book-step3">
            <div className="book-layout">
              <div className="confirm-box">
                <h2>Confirm Your Booking</h2>
                <p className="confirm-note">
                  Review your details. A <strong>50% deposit (£{chosen ? Math.round(chosen.price * 0.5) : '—'})</strong> is required via Stripe to secure your date.
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
                  <h3>💳 Pay Your Deposit Now</h3>
                  <p>After confirming, you'll pay your <strong>50% deposit directly here</strong> using our secure embedded checkout. Accepts all cards, Apple Pay &amp; Google Pay. Your date is only secured once payment is complete.</p>
                </div>

                {status === 'error' && (
                  <div className="form-err-banner">
                    Something went wrong saving your booking. Please try again or contact us at {BRAND.email}
                  </div>
                )}


                <div className="step3-nav">
                  <button type="button" className="btn-outline" onClick={() => setStep(2)}>← Edit Details</button>
                  <button type="submit" className="btn-primary" disabled={status === 'loading'}>
                    {status === 'loading' ? 'Saving…' : 'Confirm & Pay Deposit →'}
                  </button>
                </div>
              </div>

              <BookingSidebar chosen={chosen} />
            </div>
          </div>
        )}
      </form>

      {/* ── STEP 4: Payment — outside form to avoid nested form error ── */}
      {status === 'payment' && (
        <div className="book-body wrap">
          <div className="book-step4">
            <div className="book-layout">
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 400, textTransform: 'uppercase', color: 'var(--text)', marginBottom: 8 }}>Pay Your Deposit</h2>
                <p style={{ fontSize: 15, color: 'var(--text-2)', marginBottom: 28, lineHeight: 1.7 }}>
                  A 50% deposit secures your date. The remaining balance is due on the day of your session.
                </p>
                <StripeCheckout
                  booking={{ ...savedBooking, name: form.name, email: form.email }}
                  chosen={chosen}
                  onSuccess={async (paymentIntent) => {
                    await sendConfirmEmail(chosen)
                    setStatus('success')
                  }}
                  onCancel={() => { setStatus('idle'); setStep(3) }}
                />
              </div>
              <BookingSidebar chosen={chosen} />
            </div>
          </div>
        </div>
      )}
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
          <li><span>01</span><div><strong>Fill your details</strong><p>Tell us about your session — date, location, outfits.</p></div></li>
          <li><span>02</span><div><strong>Pay deposit here</strong><p>Secure embedded checkout — cards, Apple Pay &amp; Google Pay.</p></div></li>
          <li><span>03</span><div><strong>Automated reminder</strong><p>Email sent 48hrs before your shoot with everything you need.</p></div></li>
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
          <p className="label">Deposit Paid · Booking Confirmed</p>
          <h1>You're booked, {form.name.split(' ')[0]}! 🎉</h1>
          <p className="success-msg">
            Your deposit has been paid and your date is secured. A confirmation has been sent to <strong>{form.email}</strong>.
          </p>
          {chosen && (
            <div className="success-pkg">
              <div>{chosen.emoji || '📸'} <strong>{chosen.name}</strong></div>
              <div>Date: <strong>{form.preferred_date ? format(new Date(form.preferred_date), 'd MMMM yyyy') : '—'}</strong></div>
              <div>Deposit paid: <strong>£{Math.round(chosen.price * 0.5)}</strong> · Remaining on day: <strong>£{Math.round(chosen.price * 0.5)}</strong></div>
            </div>
          )}
          <div className="success-reminder">
            <span>🔔</span>
            <p>You'll receive an automatic <strong>reminder before your session</strong> with everything you need to know.</p>
          </div>
          <a href="/" className="btn-primary" style={{ marginTop: 8 }}>Back to Home</a>
        </div>
      </div>
    </div>
  )
}