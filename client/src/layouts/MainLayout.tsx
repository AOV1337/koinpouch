import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ChatWidget from '../components/ChatWidget'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--color-background)',
    }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        {children}
      </main>
      <Footer />
      <ChatWidget />
    </div>
  )
}