'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Note, notesApi, colorStyle } from '@/lib/notesApi'
import ColorPicker from './ColorPicker'
import ImageLightbox from './ImageLightbox'

type Props = {
  note: Note
  onClick: () => void
  onUpdate: (note: Note) => void
  onDelete: (id: string) => void
}

/* ── Checklist helpers ─────────────────────────────────────────── */
type CheckItem = { text: string; checked: boolean }

function parseChecklist(html: string): CheckItem[] {
  const items: CheckItem[] = []
  const re = /data-checked="(true|false)"[^>]*>[\s\S]*?<p>([\s\S]*?)<\/p>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    items.push({ checked: m[1] === 'true', text: m[2].replace(/<[^>]*>/g, '').trim() })
  }
  return items
}

export default function NoteCard({ note, onClick, onUpdate, onDelete }: Props) {
  const [showActions, setShowActions] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [loading, setLoading] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const colors = colorStyle(note.color)
  const isChecklist = note.noteType === 'checklist'
  const checkItems = isChecklist && note.content ? parseChecklist(note.content) : []
  const checkedCount = checkItems.filter((i) => i.checked).length
  const plainText = !isChecklist && note.content
    ? note.content.replace(/<[^>]*>/g, '').trim()
    : ''

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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: loading ? 0.3 : 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, y: -8 }}
      transition={{ duration: 0.2 }}
      className={`
        relative rounded-2xl border cursor-pointer mb-4 break-inside-avoid group
        ${colors.bg} ${colors.border}
        backdrop-blur-sm
        transition-all duration-200 ease-out
        hover:shadow-[0_8px_32px_rgba(139,92,246,0.18)]
        hover:-translate-y-1
        hover:border-violet-500/35
      `}
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowColorPicker(false) }}
    >
      {/* Pin indicator */}
      {note.pinned && (
        <div className="absolute top-2.5 right-2.5 text-violet-400 text-xs drop-shadow" title="Pinned">
          📌
        </div>
      )}

      {/* Content */}
      <div className="p-4 pr-8">
        {note.title && (
          <h3 className="font-semibold text-sm text-[#ede9ff] mb-1.5 leading-snug">
            {note.title}
          </h3>
        )}

        {/* Text preview */}
        {!isChecklist && plainText && (
          <p className="text-xs text-[#9492b5] leading-relaxed line-clamp-6">
            {plainText}
          </p>
        )}

        {/* Checklist preview */}
        {isChecklist && checkItems.length > 0 && (
          <div className="space-y-1.5">
            {checkItems.slice(0, 6).map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className={`mt-0.5 w-3.5 h-3.5 flex-shrink-0 rounded border text-[9px] flex items-center justify-center ${
                  item.checked
                    ? 'bg-violet-600/60 border-violet-500/60 text-white'
                    : 'border-[#4d4b6a] bg-transparent'
                }`}>
                  {item.checked && '✓'}
                </span>
                <span className={`text-xs leading-relaxed ${
                  item.checked ? 'line-through text-[#4d4b6a]' : 'text-[#9492b5]'
                }`}>
                  {item.text || <span className="italic text-[#3d3b58]">Empty item</span>}
                </span>
              </div>
            ))}
            {checkItems.length > 6 && (
              <p className="text-[10px] text-[#4d4b6a] pl-5">+{checkItems.length - 6} more</p>
            )}
          </div>
        )}

        {/* Checklist progress bar */}
        {isChecklist && checkItems.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-[#4d4b6a]">{checkedCount}/{checkItems.length} done</span>
              <span className="text-[10px] text-[#4d4b6a]">{Math.round((checkedCount / checkItems.length) * 100)}%</span>
            </div>
            <div className="h-1 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${(checkedCount / checkItems.length) * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        {!note.title && !plainText && !isChecklist && (
          <p className="text-xs text-[#3d3b58] italic">Empty note</p>
        )}
        {isChecklist && checkItems.length === 0 && (
          <p className="text-xs text-[#3d3b58] italic">Empty checklist</p>
        )}
      </div>

      {/* Image thumbnails (up to 3) */}
      {note.images && note.images.length > 0 && (
        <div className="px-4 pb-3 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
          {note.images.slice(0, 3).map((img, idx) => (
            <div key={img.id} className="relative">
              <img
                src={img.url}
                alt=""
                className="w-16 h-16 object-cover rounded-xl border border-violet-900/20 cursor-pointer hover:opacity-90 hover:border-violet-500/30 transition-all"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(idx) }}
              />
              {idx === 2 && note.images.length > 3 && (
                <div className="absolute inset-0 bg-black/65 rounded-xl flex items-center justify-center text-xs text-white font-semibold">
                  +{note.images.length - 3}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Labels */}
      {note.labels.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {note.labels.map((l) => (
            <span
              key={l.id}
              className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300/70 border border-violet-500/15"
            >
              {l.name}
            </span>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && note.images && note.images.length > 0 && (
          <ImageLightbox
            images={note.images}
            index={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onNavigate={setLightboxIndex}
          />
        )}
      </AnimatePresence>

      {/* Hover action bar */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
            className="absolute bottom-2 left-2 right-2 flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <ActionBtn title={note.pinned ? 'Unpin' : 'Pin'} onClick={handlePin}>
              {note.pinned ? '📍' : '📌'}
            </ActionBtn>

            <div className="relative">
              <ActionBtn title="Change color" onClick={(e) => { e.stopPropagation(); setShowColorPicker((v) => !v) }}>
                🎨
              </ActionBtn>
              <AnimatePresence>
                {showColorPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                    className="absolute bottom-9 left-0 bg-[#111024] border border-violet-900/30 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-20 w-48"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ColorPicker value={note.color} onChange={handleColorChange} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <ActionBtn title="Archive" onClick={handleArchive}>🗂️</ActionBtn>
            <ActionBtn title="Delete" onClick={handleDelete}>🗑️</ActionBtn>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function ActionBtn({ children, title, onClick }: {
  children: React.ReactNode
  title: string
  onClick: (e: React.MouseEvent) => void
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="text-sm w-7 h-7 flex items-center justify-center rounded-lg bg-black/40 hover:bg-violet-600/30 backdrop-blur transition-colors duration-150"
    >
      {children}
    </button>
  )
}
