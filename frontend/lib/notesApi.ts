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

export const NOTE_COLORS: { id: string; bg: string; border: string }[] = [
  { id: 'default', bg: 'bg-[#1a1a1a]',    border: 'border-zinc-700' },
  { id: 'red',     bg: 'bg-red-950',       border: 'border-red-800' },
  { id: 'orange',  bg: 'bg-orange-950',    border: 'border-orange-800' },
  { id: 'yellow',  bg: 'bg-yellow-950',    border: 'border-yellow-800' },
  { id: 'green',   bg: 'bg-green-950',     border: 'border-green-800' },
  { id: 'teal',    bg: 'bg-teal-950',      border: 'border-teal-800' },
  { id: 'blue',    bg: 'bg-blue-950',      border: 'border-blue-800' },
  { id: 'purple',  bg: 'bg-purple-950',    border: 'border-purple-800' },
  { id: 'pink',    bg: 'bg-pink-950',      border: 'border-pink-800' },
  { id: 'brown',   bg: 'bg-stone-900',     border: 'border-stone-700' },
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
