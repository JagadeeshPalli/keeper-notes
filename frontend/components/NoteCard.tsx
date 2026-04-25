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
  const [showActions, setShowActions]     = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [loading, setLoading]             = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const cs = colorStyle(note.color)
  const isChecklist   = note.noteType === 'checklist'
  const checkItems    = isChecklist && note.content ? parseChecklist(note.content) : []
  const checkedCount  = checkItems.filter((i) => i.checked).length
  const plainText     = !isChecklist && note.content
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
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: loading ? 0.3 : 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.93 }}
      transition={{ duration: 0.2 }}
      className="relative rounded-2xl border cursor-pointer group transition-all duration-200 ease-out"
      style={{
        ...cs.bg,
        ...cs.border,
        boxShadow: 'var(--card-shadow)',
      }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowColorPicker(false) }}
      onClick={onClick}
      whileHover={{
        y: -3,
        boxShadow: 'var(--card-hover-shadow)',
        borderColor: 'var(--border-hover)',
      }}
    >
      {/* Pin indicator */}
      {note.pinned && (
        <div className="absolute top-2.5 right-2.5 text-xs" style={{ color: 'var(--accent)' }} title="Pinned">📌</div>
      )}

      {/* Content */}
      <div className="p-4 pr-8">
        {note.title && (
          <h3 className="font-semibold text-sm mb-1.5 leading-snug" style={{ color: 'var(--text-primary)' }}>
            {note.title}
          </h3>
        )}

        {/* Plain text preview */}
        {!isChecklist && plainText && (
          <p className="text-xs leading-relaxed line-clamp-6" style={{ color: 'var(--text-secondary)' }}>
            {plainText}
          </p>
        )}

        {/* Checklist preview */}
        {isChecklist && checkItems.length > 0 && (
          <div className="space-y-1.5">
            {checkItems.slice(0, 6).map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span
                  className="mt-0.5 w-3.5 h-3.5 flex-shrink-0 rounded border text-[9px] flex items-center justify-center"
                  style={item.checked
                    ? { background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff' }
                    : { borderColor: 'var(--text-muted)', background: 'transparent' }}
                >
                  {item.checked && '✓'}
                </span>
                <span
                  className="text-xs leading-relaxed"
                  style={{ color: item.checked ? 'var(--text-muted)' : 'var(--text-secondary)',
                           textDecoration: item.checked ? 'line-through' : 'none' }}
                >
                  {item.text || <em style={{ color: 'var(--text-muted)' }}>Empty item</em>}
                </span>
              </div>
            ))}
            {checkItems.length > 6 && (
              <p className="text-[10px] pl-5" style={{ color: 'var(--text-muted)' }}>+{checkItems.length - 6} more</p>
            )}
          </div>
        )}

        {/* Progress bar */}
        {isChecklist && checkItems.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{checkedCount}/{checkItems.length} done</span>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{Math.round((checkedCount / checkItems.length) * 100)}%</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, var(--accent), var(--accent-soft))' }}
                initial={{ width: 0 }}
                animate={{ width: `${(checkedCount / checkItems.length) * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        {!note.title && !plainText && !isChecklist && (
          <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>Empty note</p>
        )}
        {isChecklist && checkItems.length === 0 && (
          <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>Empty checklist</p>
        )}
      </div>

      {/* Image thumbnails */}
      {note.images && note.images.length > 0 && (
        <div className="px-4 pb-3 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
          {note.images.slice(0, 3).map((img, idx) => (
            <div key={img.id} className="relative">
              <img
                src={img.url}
                alt=""
                className="w-16 h-16 object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                style={{ border: '1px solid var(--border)' }}
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(idx) }}
              />
              {idx === 2 && note.images.length > 3 && (
                <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center text-xs text-white font-semibold">
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
              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'var(--accent-glow)', color: 'var(--accent-soft)', border: '1px solid var(--border)' }}
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
              <ActionBtn title="Color" onClick={(e) => { e.stopPropagation(); setShowColorPicker((v) => !v) }}>🎨</ActionBtn>
              <AnimatePresence>
                {showColorPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                    className="absolute bottom-9 left-0 rounded-xl shadow-2xl z-20 w-48"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ColorPicker value={note.color} onChange={handleColorChange} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <ActionBtn title="Archive" onClick={handleArchive}>🗂️</ActionBtn>
            <ActionBtn title="Delete"  onClick={handleDelete}>🗑️</ActionBtn>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function ActionBtn({ children, title, onClick }: {
  children: React.ReactNode; title: string; onClick: (e: React.MouseEvent) => void
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="text-sm w-7 h-7 flex items-center justify-center rounded-lg backdrop-blur transition-colors duration-150"
      style={{ background: 'rgba(0,0,0,0.18)' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-glow)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.18)')}
    >
      {children}
    </button>
  )
}
