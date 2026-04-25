import { api, ApiResponse } from './api'

export type NoteImage = {
  id: string
  url: string
  fileSize: number | null   // int (bytes), max ~2.1 GB — fits INT column
  createdAt: string
}

export type Note = {
  id: string
  title: string | null
  content: string | null
  noteType: 'text' | 'checklist'
  color: string
  detectedMood: string | null
  pinned: boolean
  archived: boolean
  labels: Label[]
  images: NoteImage[]
  createdAt: string
  updatedAt: string
}

export type Label = {
  id: string
  name: string
  color: string
}

export type NoteRequest = {
  title?: string
  content?: string
  noteType?: string
  color?: string
  labelIds?: string[]
}

export const NOTE_COLORS: { id: string; bgVar: string; swatch: string }[] = [
  { id: 'default', bgVar: 'note-default', swatch: 'bg-violet-500' },
  { id: 'red',     bgVar: 'note-red',     swatch: 'bg-red-500'    },
  { id: 'orange',  bgVar: 'note-orange',  swatch: 'bg-orange-500' },
  { id: 'yellow',  bgVar: 'note-yellow',  swatch: 'bg-yellow-400' },
  { id: 'green',   bgVar: 'note-green',   swatch: 'bg-green-500'  },
  { id: 'teal',    bgVar: 'note-teal',    swatch: 'bg-teal-400'   },
  { id: 'blue',    bgVar: 'note-blue',    swatch: 'bg-blue-500'   },
  { id: 'purple',  bgVar: 'note-purple',  swatch: 'bg-purple-500' },
  { id: 'pink',    bgVar: 'note-pink',    swatch: 'bg-pink-500'   },
  { id: 'brown',   bgVar: 'note-brown',   swatch: 'bg-stone-500'  },
]

/** Returns inline style object for background + border — works in both light and dark themes */
export function colorStyle(colorId: string): { bg: React.CSSProperties; border: React.CSSProperties } {
  const c = NOTE_COLORS.find((n) => n.id === colorId) ?? NOTE_COLORS[0]
  return {
    bg:     { background: `var(--${c.bgVar}-bg)` },
    border: { borderColor: `var(--${c.bgVar}-border)` },
  }
}

export const notesApi = {
  list: (search?: string, labelId?: string) =>
    api.get<ApiResponse<Note[]>>('/api/notes', {
      params: { search: search || undefined, label: labelId || undefined },
    }),

  archived: () => api.get<ApiResponse<Note[]>>('/api/notes/archived'),

  get: (id: string) => api.get<ApiResponse<Note>>(`/api/notes/${id}`),

  create: (data: NoteRequest) =>
    api.post<ApiResponse<Note>>('/api/notes', data),

  update: (id: string, data: NoteRequest) =>
    api.put<ApiResponse<Note>>(`/api/notes/${id}`, data),

  delete: (id: string) => api.delete(`/api/notes/${id}`),

  pin: (id: string) => api.put<ApiResponse<Note>>(`/api/notes/${id}/pin`),

  archive: (id: string) => api.put<ApiResponse<Note>>(`/api/notes/${id}/archive`),

  uploadImage: (noteId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<ApiResponse<NoteImage>>(`/api/notes/${noteId}/images`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  deleteImage: (noteId: string, imageId: string) =>
    api.delete(`/api/notes/${noteId}/images/${imageId}`),
}

export const labelsApi = {
  list: () => api.get<ApiResponse<Label[]>>('/api/labels'),

  create: (name: string, color?: string) =>
    api.post<ApiResponse<Label>>('/api/labels', { name, color }),

  update: (id: string, name: string, color?: string) =>
    api.put<ApiResponse<Label>>(`/api/labels/${id}`, { name, color }),

  delete: (id: string) => api.delete(`/api/labels/${id}`),
}
