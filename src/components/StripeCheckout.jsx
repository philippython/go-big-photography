import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import './StripeCheckout.css'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// ── Outer component — fetches client secret, renders Elements ──
export default function StripeCheckout({ booking, chosen, onSuccess, onCancel }) {
  const [clientSecret, setClientSecret] = useState('')
  const [loadError, setLoadError]       = useState('')
  const [loading, setLoading]           = useState(true)

  const depositAmount = chosen?.price ? Math.round(chosen.price * 0.5) : 0

  useEffect(() => {
    async function createIntent() {
      setLoading(true)
      setLoadError('')
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/create-payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            amount:       depositAmount,
            currency:     'gbp',
            booking_id:   booking?.id    || '',
            client_name:  booking?.name  || '',
            package_name: chosen?.name   || '',
          }),
        })

        const data = await res.json()
        console.log('Payment intent response:', res.status, data)

        if (!res.ok || data.error) {
          setLoadError(data.error || `Server error (${res.status}) — check Edge Function logs`)
        } else {
          setClientSecret(data.clientSecret)
        }
      } catch (err) {
        console.error('Payment fetch error:', err)
        setLoadError(
          'Could not connect to payment service. ' +
          'Check: 1) Edge Function is deployed 2) STRIPE_SECRET_KEY secret is set 3) No trailing slash in VITE_SUPABASE_URL'
        )
      }
      setLoading(false)
    }

    if (depositAmount > 0) createIntent()
  }, [depositAmount])

  const appearance = {
    theme: 'night',
    variables: {
      colorPrimary:        '#f59e0b',
      colorBackground:     '#181818',
      colorText:           '#f0ede8',
      colorDanger:         '#ef4444',
      fontFamily:          "'Inter', sans-serif",
      borderRadius:        '6px',
      spacingUnit:         '4px',
    },
    rules: {
      '.Input': {
        border:      '1px solid rgba(255,255,255,0.1)',
        boxShadow:   'none',
        padding:     '12px 14px',
      },
      '.Input:focus': {
        border:    '1px solid #f59e0b',
        boxShadow: '0 0 0 2px rgba(245,158,11,0.15)',
      },
      '.Label': {
        fontSize:    '11px',
        fontWeight:  '700',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color:       '#888',
      },
      '.Tab': {
        border:     '1px solid rgba(255,255,255,0.08)',
        background: '#111',
      },
      '.Tab--selected': {
        border:  '1px solid #f59e0b',
        background: 'rgba(245,158,11,0.1)',
      },
      '.TabIcon--selected': { fill: '#f59e0b' },
      '.TabLabel--selected': { color: '#f59e0b' },
    },
  }

  if (loading) {
    return (
      <div className="stripe-wrap">
        <div className="stripe-loading">
          <div className="stripe-spinner" />
          <p>Setting up secure payment…</p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="stripe-wrap">
        <div className="stripe-error">
          <span>⚠️</span>
          <p>{loadError}</p>
          <button className="btn-outline" onClick={onCancel}>Go Back</button>
        </div>
      </div>
    )
  }

  return (
    <div className="stripe-wrap">
      {/* Summary */}
      <div className="stripe-summary">
        <div className="stripe-summary__pkg">
          <span>{chosen?.emoji || '📸'}</span>
          <div>
            <strong>{chosen?.name}</strong>
            <p>50% deposit to secure your date</p>
          </div>
        </div>
        <div className="stripe-summary__amount">
          <span>Deposit</span>
          <strong>£{depositAmount}</strong>
        </div>
      </div>

      <div className="stripe-notice">
        🔒 Secure payment powered by Stripe · Cards, Apple Pay &amp; Google Pay accepted
      </div>

      {clientSecret && (
        <Elements
          stripe={stripePromise}
          options={{ clientSecret, appearance }}
        >
          <CheckoutForm
            booking={booking}
            depositAmount={depositAmount}
            onSuccess={onSuccess}
            onCancel={onCancel}
          />
        </Elements>
      )}
    </div>
  )
}

// ── Inner form component — inside Elements context ─────────────
function CheckoutForm({ booking, depositAmount, onSuccess, onCancel }) {
  const stripe   = useStripe()
  const elements = useElements()

  const [paying,  setPaying]  = useState(false)
  const [payError, setPayError] = useState('')

  async function handlePay(e) {
    e.preventDefault()
    if (!stripe || !elements) return

    setPaying(true)
    setPayError('')

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/booking-complete',
        payment_method_data: {
          billing_details: {
            name:  booking?.name  || '',
            email: booking?.email || '',
          },
        },
      },
      redirect: 'if_required',
    })

    if (error) {
      setPayError(error.message)
      setPaying(false)
      return
    }

    if (paymentIntent?.status === 'succeeded') {
      onSuccess(paymentIntent)
    } else {
      setPayError('Payment was not completed. Please try again.')
      setPaying(false)
    }
  }

  return (
    <form onSubmit={handlePay} className="stripe-form">
      <PaymentElement
        options={{
          layout:   'tabs',
          wallets:  { applePay: 'auto', googlePay: 'auto' },
          fields: {
            billingDetails: {
              name:  'never',
              email: 'never',
            },
          },
        }}
      />

      {payError && (
        <div className="stripe-pay-error">
          ⚠️ {payError}
        </div>
      )}

      <div className="stripe-form-actions">
        <button
          type="button"
          className="btn-outline"
          onClick={onCancel}
          disabled={paying}
        >
          ← Back
        </button>
        <button
          type="submit"
          className="btn-primary stripe-pay-btn"
          disabled={!stripe || paying}
        >
          {paying ? (
            <><span className="stripe-btn-spinner" /> Processing…</>
          ) : (
            <>Pay £{depositAmount} Deposit →</>
          )}
        </button>
      </div>

      <p className="stripe-security-note">
        Your payment is encrypted and processed securely by Stripe.
        GoBig Photography never sees your card details.
      </p>
    </form>
  )
}