import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', color:'var(--text-2)' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:32, color:'var(--orange)', marginBottom:12 }}>◎</div>
        <p style={{ fontSize:13, letterSpacing:'0.1em' }}>LOADING…</p>
      </div>
    </div>
  )
  return user ? children : <Navigate to="/admin/login" replace />
}
