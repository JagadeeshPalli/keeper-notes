'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, loadUser, logout } = useAuthStore()

  useEffect(() => {
    loadUser()
  }, [loadUser])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  async function handleLogout() {
    await logout()
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Top bar */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">Keeper Notes</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-400">{user.displayName}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-zinc-500 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Placeholder content — Phase 3 will fill this */}
      <main className="flex flex-col items-center justify-center h-[calc(100vh-65px)] gap-3">
        <div className="text-5xl">📝</div>
        <h2 className="text-xl font-medium text-zinc-200">Welcome, {user.displayName}</h2>
        <p className="text-sm text-zinc-500">Notes will appear here. Phase 3 coming next.</p>
      </main>
    </div>
  )
}
