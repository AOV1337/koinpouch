import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import MainLayout from './layouts/MainLayout'

import Home from './pages/Home'
import Browse from './pages/Browse'
import ItemDetail from './pages/ItemDetail'
import SellerProfile from './pages/SellerProfile'
import Guides from './pages/Guides'
import GuideDetail from './pages/GuideDetail'
import Database from './pages/Database'
import DatabaseItemDetail from './pages/DatabaseItemDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import BuyerDashboard from './pages/BuyerDashboard'
import SellerDashboard from './pages/SellerDashboard'
import AdminDashboard from './pages/AdminDashboard'
import NotFound from './pages/NotFound'
import { useProfile } from './hooks/useProfile'

function ProtectedRoute({ children, requiredRole }: {
  children: React.ReactNode
  requiredRole?: 'buyer' | 'seller' | 'admin'
}) {
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useProfile()

  if (authLoading || profileLoading) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-text-secondary)',
        fontSize: '1rem',
      }}>
        Loading...
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (requiredRole && profile?.role !== requiredRole) {
    // Redirect to their correct dashboard instead of a blank page
    if (profile?.role === 'admin') return <Navigate to="/dashboard/admin" replace />
    if (profile?.role === 'seller') return <Navigate to="/dashboard/seller" replace />
    return <Navigate to="/dashboard/buyer" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<MainLayout><Home /></MainLayout>} />
        <Route path="/browse" element={<MainLayout><Browse /></MainLayout>} />
        <Route path="/item/:id" element={<MainLayout><ItemDetail /></MainLayout>} />
        <Route path="/seller/:id" element={<MainLayout><SellerProfile /></MainLayout>} />
        <Route path="/guides" element={<MainLayout><Guides /></MainLayout>} />
        <Route path="/guides/:slug" element={<MainLayout><GuideDetail /></MainLayout>} />
        <Route path="/database" element={<MainLayout><Database /></MainLayout>} />
        <Route path="/database/:id" element={<MainLayout><DatabaseItemDetail /></MainLayout>} />
        <Route path="/login" element={<MainLayout><Login /></MainLayout>} />
        <Route path="/register" element={<MainLayout><Register /></MainLayout>} />

        {/* Protected routes */}
        <Route path="/dashboard/buyer" element={
          <ProtectedRoute requiredRole="buyer">
            <BuyerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/seller" element={
          <ProtectedRoute requiredRole="seller">
            <SellerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/admin" element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<MainLayout><NotFound /></MainLayout>} />
      </Routes>
    </BrowserRouter>
  )
}