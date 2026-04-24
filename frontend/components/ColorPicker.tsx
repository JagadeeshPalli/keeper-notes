'use client'

import { NOTE_COLORS } from '@/lib/notesApi'

type Props = {
  value: string
  onChange: (color: string) => void
}

export default function ColorPicker({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2 p-2">
      {NOTE_COLORS.map((c) => (
        <button
          key={c.id}
          onClick={() => onChange(c.id)}
          title={c.id}
          className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${c.bg} ${
            value === c.id ? 'border-white scale-110' : 'border-transparent'
          }`}
        />
      ))}
    </div>
  )
}
