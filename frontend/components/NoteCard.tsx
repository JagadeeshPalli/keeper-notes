'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Note, notesApi, colorStyle } from '@/lib/notesApi'
import ColorPicker from './ColorPicker'

type Props = {
  note: Note
  onClick: () => void
  onUpdate: (note: Note) => void
  onDelete: (id: string) => void
}

export default function NoteCard({ note, onClick, onUpdate, onDelete }: Props) {
  const [showActions, setShowActions] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [loading, setLoading] = useState(false)

  const colors = colorStyle(note.color)

  async function handlePin(e: React.MouseEvent) {
    e.stopPropagation()
    const res = await notesApi.pin(note.id)
    onUpdate(res.data.data)
  }

  async function handleArchive(e: React.MouseEvent) {
    e.stopPropagation()
    await notesApi.archive(note.id)
    onDelete(note.id)
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    setLoading(true)
    await notesApi.delete(note.id)
    onDelete(note.id)
  }

  async function handleColorChange(color: string) {
    setShowColorPicker(false)
    const res = await notesApi.update(note.id, { color })
    onUpdate(res.data.data)
  }

  // Strip HTML tags for plain-text preview
  const plainText = note.content
    ? note.content.replace(/<[^>]*>/g, '').trim()
    : ''

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: loading ? 0.4 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.18 }}
      className={`relative rounded-xl border cursor-pointer mb-4 break-inside-avoid group ${colors.bg} ${colors.border} hover:shadow-lg hover:-translate-y-0.5 transition-all duration-150`}
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowColorPicker(false) }}
    >
      {/* Pin indicator */}
      {note.pinned && (
        <div className="absolute top-2 right-2 text-yellow-400 text-xs" title="Pinned">📌</div>
      )}

      {/* Content */}
      <div className="p-4 pr-8">
        {note.title && (
          <h3 className="font-medium text-sm text-white mb-1 leading-snug">
            {note.title}
          </h3>
        )}
        {plainText && (
          <p className="text-xs text-zinc-400 leading-relaxed line-clamp-6">
            {plainText}
          </p>
        )}
        {!note.title && !plainText && (
          <p className="text-xs text-zinc-600 italic">Empty note</p>
        )}
      </div>

      {/* Labels */}
      {note.labels.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1">
          {note.labels.map((l) => (
            <span
              key={l.id}
              className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/10"
            >
              {l.name}
            </span>
          ))}
        </div>
      )}

      {/* Hover action bar */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="absolute bottom-2 left-2 right-2 flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pin */}
            <ActionBtn
              title={note.pinned ? 'Unpin' : 'Pin'}
              onClick={handlePin}
            >
              {note.pinned ? '📍' : '📌'}
            </ActionBtn>

            {/* Color */}
            <div className="relative">
              <ActionBtn title="Change color" onClick={(e) => { e.stopPropagation(); setShowColorPicker((v) => !v) }}>
                🎨
              </ActionBtn>
              <AnimatePresence>
                {showColorPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute bottom-8 left-0 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-20 w-48"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ColorPicker value={note.color} onChange={handleColorChange} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Archive */}
            <ActionBtn title="Archive" onClick={handleArchive}>🗂️</ActionBtn>

            {/* Delete */}
            <ActionBtn title="Delete" onClick={handleDelete}>🗑️</ActionBtn>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function ActionBtn({
  children, title, onClick
}: {
  children: React.ReactNode
  title: string
  onClick: (e: React.MouseEvent) => void
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="text-sm w-7 h-7 flex items-center justify-center rounded-lg bg-black/30 hover:bg-black/60 backdrop-blur transition"
    >
      {children}
    </button>
  )
}
