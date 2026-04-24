'use client'

import { useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { motion, AnimatePresence } from 'framer-motion'
import { Note, NoteRequest, notesApi, colorStyle } from '@/lib/notesApi'
import ColorPicker from './ColorPicker'

type Props = {
  note: Note | null          // null = creating new
  onClose: () => void
  onSave: (note: Note) => void
}

export default function NoteEditor({ note, onClose, onSave }: Props) {
  const [title, setTitle] = useState(note?.title ?? '')
  const [color, setColor] = useState(note?.color ?? 'default')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [saving, setSaving] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Take a note…' }),
    ],
    content: note?.content ?? '',
    editorProps: {
      attributes: {
        class: 'outline-none min-h-[120px] text-sm text-zinc-200 leading-relaxed prose prose-invert max-w-none',
      },
    },
  })

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleSave()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  async function handleSave() {
    if (saving) return
    const content = editor?.getHTML() ?? ''
    const hasContent = title.trim() || content.replace(/<[^>]*>/g, '').trim()
    if (!hasContent && !note) { onClose(); return }

    setSaving(true)
    try {
      const payload: NoteRequest = { title: title || undefined, content, color }
      let saved: Note
      if (note) {
        const res = await notesApi.update(note.id, payload)
        saved = res.data.data
      } else {
        const res = await notesApi.create(payload)
        saved = res.data.data
      }
      onSave(saved)
    } finally {
      setSaving(false)
      onClose()
    }
  }

  const colors = colorStyle(color)

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={handleSave}
      />

      {/* Modal */}
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.96, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.15 }}
        className={`fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg rounded-2xl border shadow-2xl ${colors.bg} ${colors.border}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          {/* Title */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full bg-transparent text-white font-medium text-base outline-none placeholder-zinc-600 mb-3"
          />

          {/* Tiptap editor */}
          <EditorContent editor={editor} />
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
          <div className="flex items-center gap-2">
            {/* Color picker toggle */}
            <div className="relative">
              <button
                onClick={() => setShowColorPicker((v) => !v)}
                className="text-sm w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition text-zinc-400 hover:text-white"
                title="Background color"
              >
                🎨
              </button>
              <AnimatePresence>
                {showColorPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute bottom-10 left-0 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-20 w-52"
                  >
                    <ColorPicker
                      value={color}
                      onChange={(c) => { setColor(c); setShowColorPicker(false) }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bold */}
            <EditorBtn
              active={editor?.isActive('bold') ?? false}
              onClick={() => editor?.chain().focus().toggleBold().run()}
              title="Bold"
            >B</EditorBtn>

            {/* Italic */}
            <EditorBtn
              active={editor?.isActive('italic') ?? false}
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              title="Italic"
            ><em>I</em></EditorBtn>

            {/* Bullet list */}
            <EditorBtn
              active={editor?.isActive('bulletList') ?? false}
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              title="Bullet list"
            >≡</EditorBtn>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="text-sm px-4 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-zinc-900 font-semibold transition disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Close'}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

function EditorBtn({
  children, active, onClick, title
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
  title: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`text-sm w-8 h-8 flex items-center justify-center rounded-lg transition font-medium ${
        active ? 'bg-white/20 text-white' : 'text-zinc-400 hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}
