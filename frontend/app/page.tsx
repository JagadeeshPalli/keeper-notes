'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import Logo from '@/components/Logo'
import ThemeToggle from '@/components/ThemeToggle'

// ── Fade-up animation helper ───────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, ease: 'easeOut' as const, delay },
})

// ── Feature cards data ─────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: '✨',
    title: 'AI Assistant',
    desc: 'Summarize, expand, fix grammar, or get label suggestions — powered by Gemini with 3 free credits included.',
  },
  {
    icon: '📝',
    title: 'Rich Text Editor',
    desc: 'Bold, italic, bullet lists, checklists — a full editor that stays out of your way.',
  },
  {
    icon: '🎨',
    title: 'Color Themes',
    desc: '10 note color themes so you can visually group and distinguish your notes at a glance.',
  },
  {
    icon: '🖼️',
    title: 'Image Uploads',
    desc: 'Attach images to any note. Drag & drop or click to upload — stored securely on Cloudflare R2.',
  },
  {
    icon: '🌙',
    title: 'Dark Mode',
    desc: 'A carefully crafted dark theme that actually looks good. Switches instantly, remembers your preference.',
  },
  {
    icon: '🏷️',
    title: 'Smart Labels',
    desc: 'Organise notes with labels. Let AI suggest the right tags based on your content.',
  },
]

// ── How it works steps ─────────────────────────────────────────────────────
const STEPS = [
  {
    number: '01',
    title: 'Create a note',
    desc: 'Click the + button, type your thoughts, pick a color. Done in seconds.',
  },
  {
    number: '02',
    title: 'Organise your way',
    desc: 'Use colors, labels, and checklists to keep everything where you expect it.',
  },
  {
    number: '03',
    title: 'Let AI assist',
    desc: 'Hit the AI panel inside any note to summarize, expand, or clean up your writing instantly.',
  },
]

// ── Mock note cards for the hero visual ───────────────────────────────────
// Uses CSS vars so they theme correctly in dark mode
const MOCK_NOTES = [
  {
    bgVar: 'var(--note-blue-bg)',
    borderVar: 'var(--note-blue-border)',
    barColor: 'rgba(37,99,235,0.22)',
    title: 'Project ideas',
    lines: [60, 80, 45],
    badge: '🏷️ ideas',
  },
  {
    bgVar: 'var(--note-purple-bg)',
    borderVar: 'var(--note-purple-border)',
    barColor: 'rgba(147,51,234,0.22)',
    title: 'Meeting notes',
    lines: [75, 55, 70, 40],
    badge: '🏷️ work',
  },
  {
    bgVar: 'var(--note-green-bg)',
    borderVar: 'var(--note-green-border)',
    barColor: 'rgba(22,163,74,0.22)',
    title: '☑ Weekly goals',
    lines: [65, 50, 80],
    badge: '🏷️ goals',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-root)', color: 'var(--text-primary)' }}>

      {/* ── Ambient background blobs ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-0">
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-30 animate-blob"
          style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)', filter: 'blur(80px)' }}
        />
        <div
          className="absolute top-1/2 -right-60 w-[500px] h-[500px] rounded-full opacity-20 animate-blob animation-delay-2000"
          style={{ background: 'radial-gradient(circle, var(--accent-soft) 0%, transparent 70%)', filter: 'blur(80px)' }}
        />
        <div
          className="absolute -bottom-40 left-1/3 w-[400px] h-[400px] rounded-full opacity-20 animate-blob animation-delay-4000"
          style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)', filter: 'blur(80px)' }}
        />
      </div>

      {/* ════════════════════════════════════════════════
          NAVBAR
      ════════════════════════════════════════════════ */}
      <nav
        className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4"
        style={{
          background: 'var(--nav-glass)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 select-none">
          <Logo size={28} />
          <span className="font-bold text-base tracking-tight" style={{ color: 'var(--text-primary)' }}>
            KeeperNotes
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="text-sm font-medium px-4 py-1.5 rounded-lg transition-all"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="btn-accent text-sm px-4 py-1.5 rounded-xl"
          >
            Get started →
          </Link>
        </div>
      </nav>

      {/* ════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════ */}
      <section className="relative pt-36 pb-24 px-6 max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">

        {/* Left — copy */}
        <div className="flex-1 text-center lg:text-left">
          <motion.div {...fadeUp(0)}>
            <span
              className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-6"
              style={{ background: 'var(--accent-glow)', color: 'var(--accent-soft)', border: '1px solid var(--border-hover)' }}
            >
              <span>✨</span> Gemini AI built right in
            </span>
          </motion.div>

          <motion.h1
            {...fadeUp(0.08)}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-6"
          >
            Notes that{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, var(--accent), var(--accent-soft))' }}
            >
              think
            </span>
            {' '}with you
          </motion.h1>

          <motion.p
            {...fadeUp(0.16)}
            className="text-lg leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0"
            style={{ color: 'var(--text-secondary)' }}
          >
            KeeperNotes is a fast, beautiful note-taking app with an AI assistant built in.
            Write, organise, and let Gemini help — all in one place.
          </motion.p>

          <motion.div {...fadeUp(0.22)} className="flex flex-wrap gap-3 justify-center lg:justify-start">
            <Link href="/register" className="btn-accent text-sm px-6 py-3 rounded-xl">
              Start for free →
            </Link>
            <Link
              href="/login"
              className="text-sm px-6 py-3 rounded-xl font-medium transition-all"
              style={{
                border: '1px solid var(--border-hover)',
                color: 'var(--text-secondary)',
                background: 'var(--bg-elevated)',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              Log in
            </Link>
          </motion.div>

          <motion.p
            {...fadeUp(0.28)}
            className="text-xs mt-5"
            style={{ color: 'var(--text-muted)' }}
          >
            No credit card required · 3 free AI credits included
          </motion.p>
        </div>

        {/* Right — mock note cards */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
          className="flex-1 hidden lg:flex items-center justify-center relative h-80"
        >
          {MOCK_NOTES.map((n, i) => (
            <motion.div
              key={i}
              animate={{ y: [0, i % 2 === 0 ? -8 : 8, 0] }}
              transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.8 }}
              className="absolute rounded-2xl p-4 w-52"
              style={{
                background: n.bgVar,
                border: `1px solid ${n.borderVar}`,
                left: `${i * 28}%`,
                top: i === 1 ? '-10%' : i === 2 ? '15%' : '5%',
                zIndex: i,
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              }}
            >
              <p className="text-xs font-bold mb-2.5" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
              {n.lines.map((w, j) => (
                <div
                  key={j}
                  className="h-1.5 rounded-full mb-1.5"
                  style={{ width: `${w}%`, background: n.barColor }}
                />
              ))}
              <span
                className="text-[10px] mt-2 inline-block px-2 py-0.5 rounded-full font-medium"
                style={{ background: n.barColor, color: 'var(--text-secondary)' }}
              >
                {n.badge}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════════
          FEATURES
      ════════════════════════════════════════════════ */}
      <section className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp(0)} className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--accent-soft)' }}>
              Features
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Everything you need, nothing you don't
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                {...fadeUp(i * 0.07)}
                className="rounded-2xl p-6 transition-all duration-300 group"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--card-shadow)',
                }}
                whileHover={{ y: -4, boxShadow: 'var(--card-hover-shadow)' }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-4"
                  style={{ background: 'var(--accent-glow)' }}
                >
                  {f.icon}
                </div>
                <h3 className="font-semibold text-base mb-2" style={{ color: 'var(--text-primary)' }}>
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════════════ */}
      <section className="relative py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeUp(0)} className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--accent-soft)' }}>
              How it works
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Simple by design
            </h2>
          </motion.div>

          <div className="flex flex-col md:flex-row gap-6 relative">
            {/* Connector line */}
            <div
              className="hidden md:block absolute top-10 left-[16.5%] right-[16.5%] h-px"
              style={{ background: 'linear-gradient(90deg, transparent, var(--border-hover), transparent)' }}
            />

            {STEPS.map((s, i) => (
              <motion.div
                key={s.number}
                {...fadeUp(i * 0.12)}
                className="flex-1 text-center relative"
              >
                {/* Step number circle */}
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 font-black text-2xl relative z-10"
                  style={{
                    background: 'linear-gradient(135deg, var(--accent), var(--accent-soft))',
                    color: '#fff',
                    boxShadow: '0 8px 24px var(--accent-glow)',
                  }}
                >
                  {s.number}
                </div>
                <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {s.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          CTA BANNER
      ════════════════════════════════════════════════ */}
      <section className="relative py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            {...fadeUp(0)}
            className="rounded-3xl p-12 text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-soft) 100%)',
              boxShadow: '0 24px 80px var(--accent-glow)',
            }}
          >
            {/* Decorative blobs inside banner */}
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20"
              style={{ background: 'white', filter: 'blur(40px)' }} />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full opacity-10"
              style={{ background: 'white', filter: 'blur(40px)' }} />

            <div className="relative z-10">
              <p className="text-white/80 text-sm font-semibold uppercase tracking-widest mb-4">
                Get started today
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">
                Ready to take smarter notes?
              </h2>
              <p className="text-white/75 mb-8 max-w-md mx-auto">
                Join for free. No credit card, no limits on notes. Just a better way to think.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-white font-bold text-sm px-7 py-3 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg"
                style={{ color: 'var(--accent)' }}
              >
                Create free account →
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════ */}
      <footer
        className="relative border-t py-10 px-6"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <Logo size={22} />
            <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>KeeperNotes</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm" style={{ color: 'var(--text-muted)' }}>
            <Link href="/login" className="hover:text-[var(--text-primary)] transition-colors">Log in</Link>
            <Link href="/register" className="hover:text-[var(--text-primary)] transition-colors">Register</Link>
          </div>

          {/* Copy */}
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} KeeperNotes. Built with ❤️
          </p>
        </div>
      </footer>

    </div>
  )
}
