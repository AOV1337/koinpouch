import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'

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

function ProtectedRoute({ children, requiredRole }: {
  children: React.ReactNode
  requiredRole?: 'buyer' | 'seller' | 'admin'
}) {
  const { user, loading } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/item/:id" element={<ItemDetail />} />
        <Route path="/seller/:id" element={<SellerProfile />} />
        <Route path="/guides" element={<Guides />} />
        <Route path="/guides/:slug" element={<GuideDetail />} />
        <Route path="/database" element={<Database />} />
        <Route path="/database/:id" element={<DatabaseItemDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route path="/dashboard/buyer" element={
          <ProtectedRoute>
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
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}