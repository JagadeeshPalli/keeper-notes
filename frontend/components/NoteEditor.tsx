'use client'

import { useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { motion, AnimatePresence } from 'framer-motion'
import { Note, NoteImage, NoteRequest, notesApi, colorStyle } from '@/lib/notesApi'
import ColorPicker from './ColorPicker'
import ImageLightbox from './ImageLightbox'

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
      Placeholder.configure({ placeholder: 'Take a note…' }),
    ],
    content: note?.content ?? '',
    editorProps: {
      attributes: {
        class: 'outline-none min-h-[120px] text-sm text-zinc-200 leading-relaxed prose prose-invert max-w-none',
      },
    },
  })

  // Close on Escape (but not when lightbox is open)
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
      const payload: NoteRequest = { title: title || undefined, content, color }
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

  async function handleFiles(files: FileList | File[]) {
    if (!note) return  // images only for existing notes
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
          className={`fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg rounded-2xl border shadow-2xl ${colors.bg} ${colors.border} ${dragOver ? 'ring-2 ring-yellow-400/60' : ''}`}
          onClick={(e) => e.stopPropagation()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
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

            {/* Image strip — only for existing notes */}
            {note && (
              <div className="mt-4">
                {images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {images.map((img, idx) => (
                      <div key={img.id} className="relative group/img">
                        <img
                          src={img.url}
                          alt=""
                          className="w-20 h-20 object-cover rounded-lg border border-white/10 cursor-pointer"
                          onClick={() => setLightboxIndex(idx)}
                        />
                        <button
                          onClick={(e) => handleDeleteImage(img, e)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-zinc-900 border border-white/20 text-zinc-400 hover:text-white text-[10px] opacity-0 group-hover/img:opacity-100 transition"
                          title="Remove image"
                        >✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload hint */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {uploadingImage
                    ? <><span className="w-3 h-3 border border-zinc-500 border-t-transparent rounded-full animate-spin" /> Uploading…</>
                    : <><span>🖼️</span> Add image (or drop here)</>
                  }
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                />
              </div>
            )}
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

      {/* Lightbox — portalled to document.body via AnimatePresence */}
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
