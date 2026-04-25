'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { Note, Label, notesApi, labelsApi } from '@/lib/notesApi'
import NoteCard from '@/components/NoteCard'
import NoteEditor from '@/components/NoteEditor'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, loadUser, logout } = useAuthStore()

  const [notes, setNotes] = useState<Note[]>([])
  const [labels, setLabels] = useState<Label[]>([])
  const [search, setSearch] = useState('')
  const [activeLabelId, setActiveLabelId] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [notesLoading, setNotesLoading] = useState(true)
  const [newLabelName, setNewLabelName] = useState('')
  const [addingLabel, setAddingLabel] = useState(false)

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
      <div className="min-h-screen bg-[#07070f] flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#07070f] text-[#ede9ff] flex flex-col">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-violet-900/20 bg-[#07070f]/80 backdrop-blur-xl px-5 py-3 flex items-center gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-violet-600/25 border border-violet-500/30 flex items-center justify-center text-sm shadow-[0_0_12px_rgba(139,92,246,0.3)]">
            📝
          </div>
          <h1 className="text-sm font-bold tracking-tight bg-gradient-to-r from-violet-300 to-purple-300 bg-clip-text text-transparent">
            Keeper Notes
          </h1>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xl mx-auto relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4d4b6a] text-sm pointer-events-none">🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes…"
            className="w-full bg-white/[0.04] border border-violet-900/25 rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#ede9ff] placeholder-[#4d4b6a] focus:outline-none focus:ring-2 focus:ring-violet-500/35 focus:border-violet-500/40 transition-all"
          />
        </div>

        {/* User */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-violet-600/30 border border-violet-500/30 flex items-center justify-center text-xs font-semibold text-violet-300">
              {user?.displayName?.[0]?.toUpperCase() ?? '?'}
            </div>
            <span className="text-xs text-[#9492b5]">{user?.displayName}</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-[#4d4b6a] hover:text-[#ede9ff] px-3 py-1.5 rounded-lg hover:bg-white/[0.05] transition-all"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ──────────────────────────────────────────────── */}
        <aside className="w-56 shrink-0 border-r border-violet-900/15 p-3 flex flex-col gap-0.5 overflow-y-auto bg-[#07070f]">
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
            <span className="text-[9px] font-bold text-[#3d3b58] uppercase tracking-[0.12em]">Labels</span>
            <button
              onClick={() => setAddingLabel(true)}
              className="w-5 h-5 flex items-center justify-center text-[#4d4b6a] hover:text-violet-400 hover:bg-violet-600/10 rounded transition-all text-base leading-none"
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
                  className="w-full bg-white/[0.04] border border-violet-900/30 rounded-lg px-3 py-2 text-xs text-[#ede9ff] placeholder-[#4d4b6a] focus:outline-none focus:ring-1 focus:ring-violet-500/40"
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
        <main className="flex-1 overflow-y-auto p-6">

          {/* New note bar */}
          {!showArchived && (
            <motion.div
              onClick={openNew}
              whileHover={{ scale: 1.005 }}
              whileTap={{ scale: 0.998 }}
              className="w-full max-w-2xl mx-auto mb-8 glass rounded-2xl px-5 py-3.5 text-sm text-[#4d4b6a] cursor-text
                hover:bg-violet-600/[0.06] hover:border-violet-500/30 hover:text-violet-400/60
                hover:shadow-[0_4px_24px_rgba(139,92,246,0.12)]
                transition-all duration-200 select-none"
            >
              Take a note…
            </motion.div>
          )}

          {notesLoading ? (
            <div className="flex justify-center py-24">
              <div className="w-7 h-7 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notes.length === 0 ? (
            <EmptyState search={search} archived={showArchived} />
          ) : (
            <>
              {pinnedNotes.length > 0 && (
                <section className="mb-8 max-w-5xl mx-auto">
                  <SectionLabel>📌 Pinned</SectionLabel>
                  <MasonryGrid notes={pinnedNotes} onEdit={openEdit} onUpdate={handleSave} onDelete={handleDelete} />
                </section>
              )}

              {unpinnedNotes.length > 0 && (
                <section className="max-w-5xl mx-auto">
                  {pinnedNotes.length > 0 && <SectionLabel>Other</SectionLabel>}
                  <MasonryGrid notes={unpinnedNotes} onEdit={openEdit} onUpdate={handleSave} onDelete={handleDelete} />
                </section>
              )}
            </>
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
    <div style={{ columns: '220px', columnGap: '16px' }}>
      <AnimatePresence>
        {notes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            onClick={() => onEdit(note)}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))}
      </AnimatePresence>
    </div>
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
      className={`w-full text-left text-xs px-3 py-2.5 rounded-xl transition-all duration-150 flex items-center gap-2.5 font-medium ${
        active
          ? 'bg-violet-600/15 text-violet-300 border border-violet-500/20 shadow-[0_0_12px_rgba(139,92,246,0.1)]'
          : 'text-[#9492b5] hover:bg-white/[0.04] hover:text-[#ede9ff] border border-transparent'
      }`}
    >
      <span className="text-sm">{icon}</span>
      {children}
    </button>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold text-[#4d4b6a] uppercase tracking-[0.12em] mb-3 px-1">
      {children}
    </p>
  )
}

function EmptyState({ search, archived }: { search: string; archived: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-28 text-center"
    >
      <div className="w-20 h-20 rounded-2xl bg-violet-600/10 border border-violet-500/15 flex items-center justify-center text-4xl mb-5 shadow-[0_0_30px_rgba(139,92,246,0.1)]">
        {archived ? '🗂️' : search ? '🔍' : '📝'}
      </div>
      <p className="text-[#9492b5] font-semibold text-base">
        {archived ? 'No archived notes' : search ? `No results for "${search}"` : 'No notes yet'}
      </p>
      <p className="text-[#4d4b6a] text-sm mt-1.5">
        {archived ? 'Archived notes appear here' : search ? 'Try a different search term' : 'Click above to create your first note'}
      </p>
    </motion.div>
  )
}
