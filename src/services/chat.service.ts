import { get, post, request } from '@/lib/http'

export interface ChatSession {
  id:                string
  user_id:           string
  status:            'active' | 'escalated' | 'closed'
  escalation_reason: string | null
  created_at:        string
  updated_at:        string
}

export interface ChatMessageData {
  id:         string
  session_id: string
  sender:     'user' | 'ai' | 'staff'
  content:    string
  metadata:   Record<string, unknown> | null
  created_at: string
}

export interface SendMessageResponse {
  session_id:      string
  user_message:    ChatMessageData
  ai_message:      ChatMessageData
  should_escalate: boolean
}

export interface EscalationTicket {
  id:          string
  session_id:  string
  status:      string
  priority:    string
  summary:     string
  created_at:  string
}

export const chatService = {
  sendMessage: (content: string, sessionId?: string) =>
    post<SendMessageResponse>('/chat', { content, session_id: sessionId }, true),

  getSessions: () =>
    get<ChatSession[]>('/chat/sessions', true),

  getHistory: (sessionId: string, limit = 50, offset = 0) =>
    get<ChatMessageData[]>(`/chat/sessions/${sessionId}/messages?limit=${limit}&offset=${offset}`, true),

  escalate: (sessionId: string, reason: string) =>
    post<EscalationTicket>(`/chat/sessions/${sessionId}/escalate`, { reason }, true),

  closeSession: (sessionId: string) =>
    request<void>(`/chat/sessions/${sessionId}/close`, { method: 'PATCH', auth: true }),
}
