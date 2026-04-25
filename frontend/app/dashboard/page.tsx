'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import Masonry from 'react-masonry-css'
import { useAuthStore } from '@/store/authStore'
import { Note, Label, notesApi, labelsApi } from '@/lib/notesApi'
import NoteCard from '@/components/NoteCard'
import NoteEditor from '@/components/NoteEditor'
import Logo from '@/components/Logo'
import ThemeToggle from '@/components/ThemeToggle'

const MASONRY_BREAKPOINTS = {
  default: 5,
  1400: 4,
  1100: 3,
  760: 2,
  480: 1,
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, loadUser, logout } = useAuthStore()

  const [notes, setNotes]             = useState<Note[]>([])
  const [labels, setLabels]           = useState<Label[]>([])
  const [search, setSearch]           = useState('')
  const [activeLabelId, setActiveLabelId] = useState<string | null>(null)
  const [showArchived, setShowArchived]   = useState(false)
  const [editingNote, setEditingNote]     = useState<Note | null>(null)
  const [editorOpen, setEditorOpen]       = useState(false)
  const [notesLoading, setNotesLoading]   = useState(true)
  const [newLabelName, setNewLabelName]   = useState('')
  const [addingLabel, setAddingLabel]     = useState(false)

  useEffect(() => { loadUser() }, [loadUser])
  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login')
  }, [isLoading, isAuthenticated, router])

  const fetchNotes = useCallback(async () => {
    setNotesLoading(true)
    try {
      if (showArchived) {
        const res = await notesApi.archived()
        setNotes(res.data.data)
      } else {
        const res = await notesApi.list(search || undefined, activeLabelId || undefined)
        setNotes(res.data.data)
      }
    } finally {
      setNotesLoading(false)
    }
  }, [search, activeLabelId, showArchived])

  useEffect(() => { if (isAuthenticated) fetchNotes() }, [isAuthenticated, fetchNotes])

  useEffect(() => {
    if (isAuthenticated) labelsApi.list().then((r) => setLabels(r.data.data))
  }, [isAuthenticated])

  useEffect(() => {
    const t = setTimeout(() => { if (isAuthenticated) fetchNotes() }, 300)
    return () => clearTimeout(t)
  }, [search, isAuthenticated, fetchNotes])

  function openNew() { setEditingNote(null); setEditorOpen(true) }
  function openEdit(note: Note) { setEditingNote(note); setEditorOpen(true) }

  function handleSave(saved: Note) {
    setNotes((prev) => {
      const exists = prev.find((n) => n.id === saved.id)
      return exists ? prev.map((n) => (n.id === saved.id ? saved : n)) : [saved, ...prev]
    })
  }

  function handleDelete(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }

  async function handleCreateLabel(e: React.FormEvent) {
    e.preventDefault()
    if (!newLabelName.trim()) return
    const res = await labelsApi.create(newLabelName.trim())
    setLabels((prev) => [...prev, res.data.data].sort((a, b) => a.name.localeCompare(b.name)))
    setNewLabelName('')
    setAddingLabel(false)
  }

  async function handleLogout() {
    await logout()
    router.push('/login')
  }

  const pinnedNotes   = notes.filter((n) => n.pinned)
  const unpinnedNotes = notes.filter((n) => !n.pinned)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-root)' }}>
        <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-root)', color: 'var(--text-primary)' }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-30 px-5 py-3 flex items-center gap-4"
        style={{
          background: 'var(--bg-root)',
          borderBottom: '1px solid var(--border)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Logo size={28} />
          <h1
            className="text-sm font-bold tracking-tight"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-soft))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            Keeper Notes
          </h1>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xl mx-auto relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: 'var(--text-muted)' }}>🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes…"
            className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none transition-all"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
            onFocus={e => { e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-glow)'; e.currentTarget.style.borderColor = 'var(--border-hover)' }}
            onBlur={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)' }}
          />
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <ThemeToggle />
          <div className="hidden sm:flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
              style={{ background: 'var(--accent-glow)', border: '1px solid var(--border-hover)', color: 'var(--accent-soft)' }}
            >
              {user?.displayName?.[0]?.toUpperCase() ?? '?'}
            </div>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{user?.displayName}</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ──────────────────────────────────────────────── */}
        <aside
          className="w-56 shrink-0 p-3 flex flex-col gap-0.5 overflow-y-auto"
          style={{ borderRight: '1px solid var(--border)', background: 'var(--bg-root)' }}
        >
          <NavItem
            active={!showArchived && !activeLabelId}
            onClick={() => { setShowArchived(false); setActiveLabelId(null) }}
            icon="📝"
          >
            Notes
          </NavItem>
          <NavItem
            active={showArchived}
            onClick={() => { setShowArchived(true); setActiveLabelId(null) }}
            icon="🗂️"
          >
            Archive
          </NavItem>

          <div className="mt-4 mb-1.5 px-3 flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>Labels</span>
            <button
              onClick={() => setAddingLabel(true)}
              className="w-5 h-5 flex items-center justify-center rounded transition-all text-base leading-none"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-glow)'; e.currentTarget.style.color = 'var(--accent-soft)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
              title="New label"
            >+</button>
          </div>

          <AnimatePresence>
            {addingLabel && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleCreateLabel}
                className="px-2 mb-1 overflow-hidden"
              >
                <input
                  autoFocus
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  onBlur={() => { if (!newLabelName) setAddingLabel(false) }}
                  placeholder="Label name"
                  className="w-full rounded-lg px-3 py-2 text-xs outline-none"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </motion.form>
            )}
          </AnimatePresence>

          {labels.map((l) => (
            <NavItem
              key={l.id}
              active={activeLabelId === l.id}
              onClick={() => { setActiveLabelId(l.id); setShowArchived(false) }}
              icon="🏷️"
            >
              {l.name}
            </NavItem>
          ))}
        </aside>

        {/* ── Main ─────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-6 relative">
          {notesLoading ? (
            <div className="flex justify-center py-24">
              <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
            </div>
          ) : notes.length === 0 ? (
            <EmptyState search={search} archived={showArchived} onNew={openNew} />
          ) : (
            <>
              {pinnedNotes.length > 0 && (
                <section className="mb-8">
                  <SectionLabel>📌 Pinned</SectionLabel>
                  <MasonryGrid notes={pinnedNotes} onEdit={openEdit} onUpdate={handleSave} onDelete={handleDelete} />
                </section>
              )}

              {unpinnedNotes.length > 0 && (
                <section>
                  {pinnedNotes.length > 0 && <SectionLabel>Other</SectionLabel>}
                  <MasonryGrid notes={unpinnedNotes} onEdit={openEdit} onUpdate={handleSave} onDelete={handleDelete} />
                </section>
              )}
            </>
          )}

          {/* FAB — floating action button */}
          {!showArchived && (
            <motion.button
              onClick={openNew}
              className="fixed bottom-8 right-8 w-14 h-14 rounded-2xl btn-accent flex items-center justify-center text-2xl shadow-2xl z-20"
              whileHover={{ scale: 1.08, y: -2 }}
              whileTap={{ scale: 0.95 }}
              title="New note"
            >
              +
            </motion.button>
          )}
        </main>
      </div>

      {/* Note editor modal */}
      <AnimatePresence>
        {editorOpen && (
          <NoteEditor
            note={editingNote}
            onClose={() => setEditorOpen(false)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Sub-components ──────────────────────────────────────────────── */

function MasonryGrid({ notes, onEdit, onUpdate, onDelete }: {
  notes: Note[]
  onEdit: (n: Note) => void
  onUpdate: (n: Note) => void
  onDelete: (id: string) => void
}) {
  return (
    <Masonry
      breakpointCols={MASONRY_BREAKPOINTS}
      className="masonry-grid"
      columnClassName="masonry-grid-column"
    >
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onClick={() => onEdit(note)}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </Masonry>
  )
}

function NavItem({ children, active, onClick, icon }: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
  icon: string
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left text-xs px-3 py-2.5 rounded-xl transition-all duration-150 flex items-center gap-2.5 font-medium border"
      style={active
        ? { background: 'var(--accent-glow)', color: 'var(--accent-soft)', borderColor: 'var(--border-hover)' }
        : { color: 'var(--text-secondary)', borderColor: 'transparent' }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)' } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' } }}
    >
      <span className="text-sm">{icon}</span>
      {children}
    </button>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-3 px-1" style={{ color: 'var(--text-muted)' }}>
      {children}
    </p>
  )
}

function EmptyState({ search, archived, onNew }: { search: string; archived: boolean; onNew: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-28 text-center"
    >
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-5"
        style={{ background: 'var(--accent-glow)', border: '1px solid var(--border)' }}
      >
        {archived ? '🗂️' : search ? '🔍' : '📝'}
      </div>
      <p className="font-semibold text-base" style={{ color: 'var(--text-secondary)' }}>
        {archived ? 'No archived notes' : search ? `No results for "${search}"` : 'No notes yet'}
      </p>
      <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>
        {archived ? 'Archived notes appear here' : search ? 'Try a different search term' : 'Hit the + button to create your first note'}
      </p>
      {!archived && !search && (
        <motion.button
          onClick={onNew}
          className="mt-6 btn-accent px-5 py-2.5 rounded-xl text-sm"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
        >
          Create a note
        </motion.button>
      )}
    </motion.div>
  )
}
