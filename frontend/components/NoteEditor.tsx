'use client'

import { useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { motion, AnimatePresence } from 'framer-motion'
import { Note, NoteImage, NoteRequest, notesApi, colorStyle } from '@/lib/notesApi'
import ColorPicker from './ColorPicker'
import ImageLightbox from './ImageLightbox'

type Props = {
  note: Note | null
  onClose: () => void
  onSave: (note: Note) => void
}

export default function NoteEditor({ note, onClose, onSave }: Props) {
  const [title, setTitle] = useState(note?.title ?? '')
  const [color, setColor] = useState(note?.color ?? 'default')
  const [noteType, setNoteType] = useState<'text' | 'checklist'>(
    (note?.noteType as 'text' | 'checklist') ?? 'text'
  )
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [saving, setSaving] = useState(false)

  // Image state
  const [images, setImages] = useState<NoteImage[]>(note?.images ?? [])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: noteType === 'checklist' ? 'Add a checklist item…' : 'Take a note…' }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: note?.content ?? '',
    editorProps: {
      attributes: {
        class: 'outline-none min-h-[120px] text-sm text-[#ede9ff] leading-relaxed',
      },
    },
  })

  // Close on Escape (not when lightbox open)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && lightboxIndex === null) handleSave()
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
      const payload: NoteRequest = { title: title || undefined, content, color, noteType }
      let saved: Note
      if (note) {
        const res = await notesApi.update(note.id, payload)
        saved = { ...res.data.data, images }
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

  function toggleNoteType() {
    const next = noteType === 'text' ? 'checklist' : 'text'
    setNoteType(next)
    if (editor) {
      editor.commands.clearContent()
      if (next === 'checklist') {
        editor.commands.insertContent({
          type: 'taskList',
          content: [{
            type: 'taskItem',
            attrs: { checked: false },
            content: [{ type: 'paragraph' }],
          }],
        })
      }
      editor.commands.focus()
    }
  }

  async function handleFiles(files: FileList | File[]) {
    if (!note) return
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (!imageFiles.length) return
    setUploadingImage(true)
    try {
      for (const file of imageFiles) {
        const res = await notesApi.uploadImage(note.id, file)
        setImages((prev) => [...prev, res.data.data])
      }
    } finally {
      setUploadingImage(false)
    }
  }

  async function handleDeleteImage(img: NoteImage, e: React.MouseEvent) {
    e.stopPropagation()
    if (!note) return
    await notesApi.deleteImage(note.id, img.id)
    setImages((prev) => prev.filter((i) => i.id !== img.id))
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
  }

  const colors = colorStyle(color)

  return (
    <>
      <AnimatePresence>
        {/* Backdrop */}
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-40"
          onClick={handleSave}
        />

        {/* Modal */}
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.94, y: -12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className={`
            fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
            w-full max-w-lg rounded-2xl border shadow-[0_24px_80px_rgba(0,0,0,0.7)]
            ${colors.bg} ${colors.border}
            ${dragOver ? 'ring-2 ring-violet-500/50 shadow-[0_0_40px_rgba(139,92,246,0.25)]' : ''}
          `}
          onClick={(e) => e.stopPropagation()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          {/* Note type badge */}
          {noteType === 'checklist' && (
            <div className="absolute -top-3 left-4 bg-violet-600 text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full shadow-lg">
              ✓ Checklist
            </div>
          )}

          <div className="p-5">
            {/* Title */}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full bg-transparent text-[#ede9ff] font-semibold text-base outline-none placeholder-[#4d4b6a] mb-3"
            />

            {/* Tiptap editor */}
            <EditorContent editor={editor} />

            {/* Image section — existing notes only */}
            {note && (
              <div className="mt-4">
                {images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {images.map((img, idx) => (
                      <div key={img.id} className="relative group/img">
                        <img
                          src={img.url}
                          alt=""
                          className="w-20 h-20 object-cover rounded-xl border border-violet-900/20 cursor-pointer hover:border-violet-500/40 transition-all"
                          onClick={() => setLightboxIndex(idx)}
                        />
                        <button
                          onClick={(e) => handleDeleteImage(img, e)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-[#0d0c1a] border border-violet-900/40 text-[#9492b5] hover:text-white hover:border-violet-500/50 text-[10px] opacity-0 group-hover/img:opacity-100 transition-all"
                        >✕</button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="text-xs text-[#4d4b6a] hover:text-violet-400 transition-colors flex items-center gap-1.5 disabled:opacity-40"
                >
                  {uploadingImage
                    ? <><span className="w-3 h-3 border border-[#4d4b6a] border-t-violet-400 rounded-full animate-spin" /> Uploading…</>
                    : <><span>🖼️</span> Add image (or drop here)</>
                  }
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={(e) => e.target.files && handleFiles(e.target.files)} />
              </div>
            )}
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-violet-900/20">
            <div className="flex items-center gap-1.5">
              {/* Color picker */}
              <div className="relative">
                <ToolBtn onClick={() => setShowColorPicker((v) => !v)} title="Background color" active={showColorPicker}>🎨</ToolBtn>
                <AnimatePresence>
                  {showColorPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.95 }}
                      className="absolute bottom-11 left-0 bg-[#111024] border border-violet-900/30 rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.6)] z-20 w-52"
                    >
                      <ColorPicker value={color} onChange={(c) => { setColor(c); setShowColorPicker(false) }} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Note type toggle */}
              <ToolBtn
                onClick={toggleNoteType}
                title={noteType === 'text' ? 'Switch to checklist' : 'Switch to text'}
                active={noteType === 'checklist'}
              >
                {noteType === 'checklist' ? '☰' : '☑'}
              </ToolBtn>

              {/* Bold */}
              <ToolBtn active={editor?.isActive('bold') ?? false} onClick={() => editor?.chain().focus().toggleBold().run()} title="Bold">
                <strong>B</strong>
              </ToolBtn>

              {/* Italic */}
              <ToolBtn active={editor?.isActive('italic') ?? false} onClick={() => editor?.chain().focus().toggleItalic().run()} title="Italic">
                <em>I</em>
              </ToolBtn>

              {/* Bullet list */}
              <ToolBtn active={editor?.isActive('bulletList') ?? false} onClick={() => editor?.chain().focus().toggleBulletList().run()} title="Bullet list">
                ≡
              </ToolBtn>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-violet text-xs px-4 py-1.5 rounded-lg disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Close'}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && images.length > 0 && (
          <ImageLightbox
            images={images}
            index={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onNavigate={setLightboxIndex}
          />
        )}
      </AnimatePresence>
    </>
  )
}

function ToolBtn({ children, active, onClick, title }: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
  title: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`text-sm w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 font-medium ${
        active
          ? 'bg-violet-600/30 text-violet-300 shadow-[0_0_8px_rgba(139,92,246,0.3)]'
          : 'text-[#4d4b6a] hover:bg-white/[0.06] hover:text-[#ede9ff]'
      }`}
    >
      {children}
    </button>
  )
}
