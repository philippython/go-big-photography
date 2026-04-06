import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'
import './AdminLogin.css'

export default function AdminLogin() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { signIn } = useAuth()
  const navigate   = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error } = await signIn(email, password)
    if (error) { setError('Invalid email or password.'); setLoading(false) }
    else        navigate('/admin')
  }

  return (
    <div className="alog-page">
      <div className="alog-bg" />
      <div className="alog-card">
        <div className="alog-logo"><Logo size="md" /></div>
        <h1>Admin Login</h1>
        <p>Sign in to manage your portfolio &amp; bookings.</p>

        <form onSubmit={handleSubmit} className="alog-form">
          <div className="alog-field">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@gobigphotography.co.uk" required />
          </div>
          <div className="alog-field">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required />
          </div>
          {error && <div className="alog-error">{error}</div>}
          <button type="submit" className="btn-primary alog-btn" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>
      </div>
    </div>
  )
}