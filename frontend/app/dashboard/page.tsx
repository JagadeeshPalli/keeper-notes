'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
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
  const [editingNote, setEditingNote] = useState<Note | null | 'new'>('new' as never)
  const [editorOpen, setEditorOpen] = useState(false)
  const [notesLoading, setNotesLoading] = useState(true)
  const [newLabelName, setNewLabelName] = useState('')
  const [addingLabel, setAddingLabel] = useState(false)

  // Auth guard
  useEffect(() => { loadUser() }, [loadUser])
  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login')
  }, [isLoading, isAuthenticated, router])

  // Fetch notes
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

  useEffect(() => {
    if (isAuthenticated) fetchNotes()
  }, [isAuthenticated, fetchNotes])

  // Fetch labels
  useEffect(() => {
    if (isAuthenticated) {
      labelsApi.list().then((res) => setLabels(res.data.data))
    }
  }, [isAuthenticated])

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { if (isAuthenticated) fetchNotes() }, 300)
    return () => clearTimeout(t)
  }, [search, isAuthenticated, fetchNotes])

  function openNew() {
    setEditingNote(null)
    setEditorOpen(true)
  }

  function openEdit(note: Note) {
    setEditingNote(note)
    setEditorOpen(true)
  }

  function handleSave(saved: Note) {
    setNotes((prev) => {
      const exists = prev.find((n) => n.id === saved.id)
      if (exists) return prev.map((n) => (n.id === saved.id ? saved : n))
      return [saved, ...prev]
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

  const pinnedNotes = notes.filter((n) => n.pinned)
  const unpinnedNotes = notes.filter((n) => !n.pinned)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col">
      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-[#0f0f0f]/95 backdrop-blur px-4 py-3 flex items-center gap-3">
        <h1 className="text-base font-semibold tracking-tight shrink-0">Keeper Notes</h1>

        {/* Search */}
        <div className="flex-1 max-w-xl mx-auto">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes…"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-yellow-400/40 transition"
          />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-zinc-500 hidden sm:block">{user?.displayName}</span>
          <button
            onClick={handleLogout}
            className="text-xs text-zinc-500 hover:text-white transition"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ──────────────────────────────────────────────── */}
        <aside className="w-56 shrink-0 border-r border-zinc-800 p-3 flex flex-col gap-1 overflow-y-auto">
          <NavItem
            active={!showArchived && !activeLabelId}
            onClick={() => { setShowArchived(false); setActiveLabelId(null) }}
          >
            📝 Notes
          </NavItem>
          <NavItem
            active={showArchived}
            onClick={() => { setShowArchived(true); setActiveLabelId(null) }}
          >
            🗂️ Archive
          </NavItem>

          <div className="mt-3 mb-1 px-3 flex items-center justify-between">
            <span className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">Labels</span>
            <button
              onClick={() => setAddingLabel(true)}
              className="text-zinc-500 hover:text-white transition text-lg leading-none"
              title="New label"
            >+</button>
          </div>

          {addingLabel && (
            <form onSubmit={handleCreateLabel} className="px-2 mb-1">
              <input
                autoFocus
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                onBlur={() => { if (!newLabelName) setAddingLabel(false) }}
                placeholder="Label name"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-yellow-400/40"
              />
            </form>
          )}

          {labels.map((l) => (
            <NavItem
              key={l.id}
              active={activeLabelId === l.id}
              onClick={() => { setActiveLabelId(l.id); setShowArchived(false) }}
            >
              🏷️ {l.name}
            </NavItem>
          ))}
        </aside>

        {/* ── Main content ─────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* New note bar */}
          {!showArchived && (
            <div
              onClick={openNew}
              className="w-full max-w-2xl mx-auto mb-8 bg-[#1a1a1a] border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-600 cursor-text hover:border-zinc-500 transition shadow"
            >
              Take a note…
            </div>
          )}

          {notesLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notes.length === 0 ? (
            <EmptyState search={search} archived={showArchived} />
          ) : (
            <>
              {/* Pinned */}
              {pinnedNotes.length > 0 && (
                <section className="mb-6">
                  <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-3 px-1">Pinned</p>
                  <MasonryGrid
                    notes={pinnedNotes}
                    onEdit={openEdit}
                    onUpdate={handleSave}
                    onDelete={handleDelete}
                  />
                </section>
              )}

              {/* Other */}
              {unpinnedNotes.length > 0 && (
                <section>
                  {pinnedNotes.length > 0 && (
                    <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-3 px-1">Other</p>
                  )}
                  <MasonryGrid
                    notes={unpinnedNotes}
                    onEdit={openEdit}
                    onUpdate={handleSave}
                    onDelete={handleDelete}
                  />
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
            note={editingNote as Note | null}
            onClose={() => setEditorOpen(false)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

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

function NavItem({ children, active, onClick }: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left text-sm px-3 py-2 rounded-xl transition ${
        active
          ? 'bg-yellow-400/15 text-yellow-400 font-medium'
          : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

function EmptyState({ search, archived }: { search: string; archived: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-5xl mb-4">{archived ? '🗂️' : search ? '🔍' : '📝'}</div>
      <p className="text-zinc-400 font-medium">
        {archived ? 'No archived notes' : search ? `No results for "${search}"` : 'No notes yet'}
      </p>
      <p className="text-zinc-600 text-sm mt-1">
        {archived ? 'Archived notes will appear here' : search ? 'Try a different search' : 'Click above to create your first note'}
      </p>
    </div>
  )
}
