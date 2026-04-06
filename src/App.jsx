import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import Home       from './pages/Home'
import Catalogue  from './pages/Catalogue'
import Booking    from './pages/Booking'
import Terms      from './pages/Terms'
import Admin      from './pages/Admin'
import AdminLogin from './pages/AdminLogin'

function Layout() {
  const { pathname } = useLocation()
  const isAdmin = pathname.startsWith('/admin')

  return (
    <>
      <ScrollToTop />
      {!isAdmin && <Navbar />}
      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/catalogue"   element={<Catalogue />} />
        <Route path="/booking"     element={<Booking />} />
        <Route path="/terms"       element={<Terms />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={
          <ProtectedRoute><Admin /></ProtectedRoute>
        } />
      </Routes>
      {!isAdmin && <Footer />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout />
      </AuthProvider>
    </BrowserRouter>
  )
}