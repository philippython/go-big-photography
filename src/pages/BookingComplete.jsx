import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { supabase } from '../lib/supabase'
import './BookingComplete.css'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

export default function BookingComplete() {
  const [searchParams]      = useSearchParams()
  const [status, setStatus] = useState('loading')
  const [intent, setIntent] = useState(null)

  useEffect(() => {
    const clientSecret = searchParams.get('payment_intent_client_secret')
    if (!clientSecret) { setStatus('no_payment'); return }

    stripePromise.then(async stripe => {
      if (!stripe) return
      const { paymentIntent, error } = await stripe.retrievePaymentIntent(clientSecret)
      if (error || !paymentIntent) { setStatus('error'); return }

      setIntent(paymentIntent)

      if (paymentIntent.status === 'succeeded') {
        // Update booking deposit status in Supabase
        const bookingId = paymentIntent.metadata?.booking_id
        if (bookingId) {
          await supabase.from('bookings').update({
            deposit_paid: true,
            status:       'confirmed',
            updated_at:   new Date().toISOString(),
          }).eq('id', bookingId)
        }
        setStatus('success')
      } else if (paymentIntent.status === 'processing') {
        setStatus('processing')
      } else {
        setStatus('failed')
      }
    })
  }, [])

  return (
    <div className="complete-page">
      <div className="complete-inner wrap">
        {status === 'loading' && (
          <div className="complete-loading">
            <div className="complete-spinner" />
            <p>Verifying your payment…</p>
          </div>
        )}

        {status === 'success' && (
          <>
            <div className="complete-icon complete-icon--success">✓</div>
            <p className="label">Payment Successful</p>
            <h1>Your date is secured! 🎉</h1>
            <p className="complete-msg">
              Your deposit has been received. Your booking with GoBig Photography is now <strong>confirmed</strong>.
              We'll be in touch shortly with all the final details.
            </p>
            {intent && (
              <div className="complete-receipt">
                <div><span>Amount Paid</span><strong>£{(intent.amount / 100).toFixed(2)}</strong></div>
                <div><span>Reference</span><strong>{intent.id.slice(-8).toUpperCase()}</strong></div>
                <div><span>Status</span><strong style={{ color: 'var(--green)' }}>Confirmed</strong></div>
              </div>
            )}
            <div className="complete-next">
              <h3>What happens next</h3>
              <div className="complete-step">
                <span>🔔</span>
                <p>You'll receive an automatic <strong>reminder email</strong> before your session with everything you need to know.</p>
              </div>
              <div className="complete-step">
                <span>📞</span>
                <p>We may call to confirm final details. Any questions, call <strong>07903987131</strong>.</p>
              </div>
              <div className="complete-step">
                <span>💳</span>
                <p>The remaining balance is due on the day of your session.</p>
              </div>
            </div>
            <Link to="/" className="btn-primary">Back to Home</Link>
          </>
        )}

        {status === 'processing' && (
          <>
            <div className="complete-icon complete-icon--processing">⏳</div>
            <h1>Payment Processing</h1>
            <p className="complete-msg">
              Your payment is being processed. This can take a moment.
              We'll email you at <strong>{intent?.receipt_email}</strong> once confirmed.
            </p>
            <Link to="/" className="btn-outline">Back to Home</Link>
          </>
        )}

        {(status === 'failed' || status === 'error') && (
          <>
            <div className="complete-icon complete-icon--failed">✕</div>
            <h1>Payment Unsuccessful</h1>
            <p className="complete-msg">
              Your payment could not be processed. You haven't been charged.
              Please try again or contact us directly.
            </p>
            <div className="complete-actions">
              <Link to="/booking" className="btn-primary">Try Again</Link>
              <a href="tel:07903987131" className="btn-outline">📞 Call Us</a>
            </div>
          </>
        )}

        {status === 'no_payment' && (
          <>
            <div className="complete-icon complete-icon--failed">?</div>
            <h1>No payment found</h1>
            <p className="complete-msg">We couldn't find a payment to verify. If you've just booked, check your email for confirmation.</p>
            <Link to="/" className="btn-outline">Back to Home</Link>
          </>
        )}
      </div>
    </div>
  )
}