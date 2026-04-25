'use client'

import { NOTE_COLORS } from '@/lib/notesApi'

type Props = {
  value: string
  onChange: (color: string) => void
}

export default function ColorPicker({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2 p-3">
      {NOTE_COLORS.map((c) => (
        <button
          key={c.id}
          onClick={() => onChange(c.id)}
          title={c.id}
          className={`w-6 h-6 rounded-full border-2 transition-all duration-150 hover:scale-110 ${c.swatch} ${
            value === c.id
              ? 'border-white scale-110 shadow-[0_0_8px_rgba(139,92,246,0.6)]'
              : 'border-transparent opacity-70 hover:opacity-100'
          }`}
        />
      ))}
    </div>
  )
}
