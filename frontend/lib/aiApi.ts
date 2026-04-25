import { api, ApiResponse } from './api'

export type AiAction = 'summarize' | 'grammar' | 'labels' | 'expand'

export type AiAssistResponse = {
  result: string
  action: AiAction
  requestsUsed: number
  requestsLimit: number
  hasOwnKey: boolean
}

export type AiUsage = {
  requestsUsed: number
  requestsLimit: number
  hasOwnKey: boolean
}

export const aiApi = {
  getUsage: () =>
    api.get<ApiResponse<AiUsage>>('/api/ai/usage'),

  assist: (content: string, action: AiAction, title?: string) =>
    api.post<ApiResponse<AiAssistResponse>>('/api/ai/assist', { content, action, title }),

  saveKey: (apiKey: string) =>
    api.post<ApiResponse<null>>('/api/ai/key', { apiKey }),

  removeKey: () =>
    api.delete<ApiResponse<null>>('/api/ai/key'),
}
