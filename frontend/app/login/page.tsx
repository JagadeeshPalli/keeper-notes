'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'

export default function LoginPage() {
  const router = useRouter()
  const login = useAuthStore((s) => s.login)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? 'Login failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#07070f] flex items-center justify-center px-4 relative overflow-hidden">

      {/* Ambient background blobs */}
      <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-violet-700/20 rounded-full blur-[120px] animate-blob" />
      <div className="absolute bottom-1/4 -right-20 w-[400px] h-[400px] bg-purple-700/15 rounded-full blur-[100px] animate-blob animation-delay-2000" />
      <div className="absolute top-3/4 left-1/3 w-[300px] h-[300px] bg-indigo-700/10 rounded-full blur-[80px] animate-blob animation-delay-4000" />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(#8b5cf6 1px, transparent 1px), linear-gradient(90deg, #8b5cf6 1px, transparent 1px)', backgroundSize: '48px 48px' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Brand */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-600/20 border border-violet-500/30 mb-5 shadow-[0_0_30px_rgba(139,92,246,0.3)]"
          >
            <span className="text-2xl">📝</span>
          </motion.div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Keeper Notes</h1>
          <p className="text-[#9492b5] mt-2 text-sm">Your thoughts, beautifully organized</p>
        </div>

        {/* Glass card */}
        <div className="glass rounded-2xl p-8 shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
          <h2 className="text-lg font-semibold text-white mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#9492b5] mb-1.5 tracking-wide uppercase">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full bg-white/[0.04] border border-violet-900/30 rounded-xl px-4 py-3 text-sm text-white placeholder-[#4d4b6a] focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9492b5] mb-1.5 tracking-wide uppercase">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-white/[0.04] border border-violet-900/30 rounded-xl px-4 py-3 text-sm text-white placeholder-[#4d4b6a] focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/50 transition-all"
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-violet w-full rounded-xl py-3 text-sm mt-2"
            >
              {loading
                ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in…</span>
                : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-violet-900/20 text-center">
            <p className="text-sm text-[#9492b5]">
              No account?{' '}
              <Link href="/register" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
