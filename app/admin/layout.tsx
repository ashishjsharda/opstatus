import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth'
import { AdminNav } from '@/components/AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await isAdmin()
  if (!admin) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <AdminNav />
      <main className="max-w-5xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
