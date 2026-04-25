'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { NoteImage } from '@/lib/notesApi'

type Props = {
  images: NoteImage[]
  index: number
  onClose: () => void
  onNavigate: (index: number) => void
}

export default function ImageLightbox({ images, index, onClose, onNavigate }: Props) {
  const image = images[index]
  const hasPrev = index > 0
  const hasNext = index < images.length - 1

  // Guard against SSR — createPortal needs document.body
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape')      { e.stopPropagation(); onClose() }
      if (e.key === 'ArrowLeft'  && hasPrev) onNavigate(index - 1)
      if (e.key === 'ArrowRight' && hasNext) onNavigate(index + 1)
    }
    window.addEventListener('keydown', onKey, true)   // capture phase beats editor's listener
    return () => window.removeEventListener('keydown', onKey, true)
  }, [index, hasPrev, hasNext, onClose, onNavigate])

  if (!mounted) return null

  return createPortal(
    /* Backdrop — rendered at document.body so position:fixed is viewport-relative */
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/88 backdrop-blur-md"
      onClick={onClose}
    >
      {/* Image — animates on index change */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.img
          key={image.id}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.94 }}
          transition={{ duration: 0.15 }}
          src={image.url}
          alt="Note image"
          className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain shadow-2xl select-none"
          onClick={(e) => e.stopPropagation()}
          draggable={false}
        />
      </AnimatePresence>

      {/* Close */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose() }}
        className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white text-lg font-light transition-colors"
        title="Close (Esc)"
      >
        ✕
      </button>

      {/* Prev */}
      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(index - 1) }}
          className="absolute left-5 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white text-2xl transition-colors"
          title="Previous (←)"
        >
          ‹
        </button>
      )}

      {/* Next */}
      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(index + 1) }}
          className="absolute right-5 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white text-2xl transition-colors"
          title="Next (→)"
        >
          ›
        </button>
      )}

      {/* Counter */}
      {images.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-xs text-zinc-300 bg-black/50 px-3 py-1 rounded-full select-none">
          {index + 1} / {images.length}
        </div>
      )}
    </motion.div>,
    document.body
  )
}
