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

function ProtectedRoute({ children }: {
  children: React.ReactNode
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
          <ProtectedRoute>
            <MainLayout><BuyerDashboard /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/seller" element={
          <ProtectedRoute>
            <MainLayout><SellerDashboard /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/admin" element={
          <ProtectedRoute>
            <MainLayout><AdminDashboard /></MainLayout>
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<MainLayout><NotFound /></MainLayout>} />
      </Routes>
    </BrowserRouter>
  )
}