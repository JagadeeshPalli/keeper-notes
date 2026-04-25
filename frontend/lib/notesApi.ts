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

export const NOTE_COLORS: { id: string; bg: string; border: string; swatch: string }[] = [
  { id: 'default', bg: 'bg-[#0d0c1a]',  border: 'border-violet-900/25', swatch: 'bg-violet-500' },
  { id: 'red',     bg: 'bg-[#160808]',  border: 'border-red-900/40',    swatch: 'bg-red-500'    },
  { id: 'orange',  bg: 'bg-[#160d06]',  border: 'border-orange-900/40', swatch: 'bg-orange-500' },
  { id: 'yellow',  bg: 'bg-[#151008]',  border: 'border-yellow-900/40', swatch: 'bg-yellow-400' },
  { id: 'green',   bg: 'bg-[#081408]',  border: 'border-green-900/40',  swatch: 'bg-green-500'  },
  { id: 'teal',    bg: 'bg-[#061412]',  border: 'border-teal-900/40',   swatch: 'bg-teal-400'   },
  { id: 'blue',    bg: 'bg-[#070912]',  border: 'border-blue-900/40',   swatch: 'bg-blue-500'   },
  { id: 'purple',  bg: 'bg-[#0f0818]',  border: 'border-purple-900/40', swatch: 'bg-purple-500' },
  { id: 'pink',    bg: 'bg-[#160818]',  border: 'border-pink-900/40',   swatch: 'bg-pink-500'   },
  { id: 'brown',   bg: 'bg-[#140e0a]',  border: 'border-stone-800/40',  swatch: 'bg-stone-500'  },
]

export function colorStyle(colorId: string) {
  return NOTE_COLORS.find((c) => c.id === colorId) ?? NOTE_COLORS[0]
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
