import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import MainLayout from './layouts/MainLayout'
import Home from './pages/Home'
import Browse from './pages/Browse'
import ItemDetail from './pages/ItemDetail'
import SellerProfile from './pages/SellerProfile'
import Guides from './pages/Guides'
import GuideDetail from './pages/GuideDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import BuyerDashboard from './pages/BuyerDashboard'
import BuyerOrders from './pages/BuyerOrders'
import BuyerBookmarks from './pages/BuyerBookmarks'
import BuyerSupport from './pages/BuyerSupport'
import SellerDashboard from './pages/SellerDashboard'
import AdminDashboard from './pages/AdminDashboard'
import AdminTickets from './pages/AdminTickets'
import AdminKycRequests from './pages/AdminKycRequests'
import AdminGuidesManager from './pages/AdminGuidesManager'
import GuideEditor from './pages/GuideEditor'
import HallOfFame from './pages/HallOfFame'
import HallOfFameDetail from './pages/HallOfFameDetail'
import AdminHallOfFameManager from './pages/AdminHallOfFameManager'
import HallOfFameEditor from './pages/HallOfFameEditor'
import NotFound from './pages/NotFound'
import CreateListing from './pages/CreateListing'
import SellerListings from './pages/SellerListings'
import KycSubmission from './pages/KycSubmission'
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
        minHeight: '80vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: 'var(--color-text-secondary)', fontSize: '1rem',
      }}>
        Loading...
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  if (requiredRole && profile?.role !== requiredRole) {
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
        <Route path="/hall-of-fame" element={<MainLayout><HallOfFame /></MainLayout>} />
        <Route path="/hall-of-fame/:id" element={<MainLayout><HallOfFameDetail /></MainLayout>} />
        <Route path="/login" element={<MainLayout><Login /></MainLayout>} />
        <Route path="/register" element={<MainLayout><Register /></MainLayout>} />

        {/* Buyer routes */}
        <Route path="/dashboard/buyer" element={
          <ProtectedRoute requiredRole="buyer"><BuyerDashboard /></ProtectedRoute>
        } />
        <Route path="/dashboard/buyer/orders" element={
          <ProtectedRoute requiredRole="buyer"><BuyerOrders /></ProtectedRoute>
        } />
        <Route path="/dashboard/buyer/bookmarks" element={
          <ProtectedRoute requiredRole="buyer"><BuyerBookmarks /></ProtectedRoute>
        } />
        <Route path="/dashboard/buyer/support" element={
          <ProtectedRoute requiredRole="buyer"><BuyerSupport /></ProtectedRoute>
        } />

        {/* Seller routes */}
        <Route path="/dashboard/seller" element={
          <ProtectedRoute requiredRole="seller"><SellerDashboard /></ProtectedRoute>
        } />
        <Route path="/dashboard/seller/listings" element={
          <ProtectedRoute requiredRole="seller"><SellerListings /></ProtectedRoute>
        } />
        <Route path="/dashboard/seller/create" element={
          <ProtectedRoute requiredRole="seller"><CreateListing /></ProtectedRoute>
        } />
        <Route path="/dashboard/seller/kyc" element={
          <ProtectedRoute requiredRole="seller"><KycSubmission /></ProtectedRoute>
        } />

        {/* Admin routes */}
        <Route path="/dashboard/admin" element={
          <ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="/dashboard/admin/tickets" element={
          <ProtectedRoute requiredRole="admin"><AdminTickets /></ProtectedRoute>
        } />
        <Route path="/dashboard/admin/kyc-requests" element={
          <ProtectedRoute requiredRole="admin"><AdminKycRequests /></ProtectedRoute>
        } />
        <Route path="/dashboard/admin/guides" element={
          <ProtectedRoute requiredRole="admin"><AdminGuidesManager /></ProtectedRoute>
        } />
        <Route path="/dashboard/admin/guides/new" element={
          <ProtectedRoute requiredRole="admin"><GuideEditor /></ProtectedRoute>
        } />
        <Route path="/dashboard/admin/guides/:id/edit" element={
          <ProtectedRoute requiredRole="admin"><GuideEditor /></ProtectedRoute>
        } />
        <Route path="/dashboard/admin/hall-of-fame" element={
          <ProtectedRoute requiredRole="admin"><AdminHallOfFameManager /></ProtectedRoute>
        } />
        <Route path="/dashboard/admin/hall-of-fame/new" element={
          <ProtectedRoute requiredRole="admin"><HallOfFameEditor /></ProtectedRoute>
        } />
        <Route path="/dashboard/admin/hall-of-fame/:id/edit" element={
          <ProtectedRoute requiredRole="admin"><HallOfFameEditor /></ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<MainLayout><NotFound /></MainLayout>} />
      </Routes>
    </BrowserRouter>
  )
}