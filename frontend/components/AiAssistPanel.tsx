'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { aiApi, AiAction, AiUsage } from '@/lib/aiApi'

type Props = {
  /** Raw HTML from the Tiptap editor */
  getContent: () => string
  title: string
  /** Called when the user wants to apply AI output back to the editor */
  onApply: (text: string) => void
  /** Called when AI suggests labels */
  onLabels: (labels: string[]) => void
}

const ACTIONS: { id: AiAction; label: string; icon: string; description: string }[] = [
  { id: 'summarize', label: 'Summarize', icon: '✨', description: 'Condense into 2-3 sentences' },
  { id: 'grammar',   label: 'Fix Grammar', icon: '📝', description: 'Correct spelling & grammar' },
  { id: 'labels',    label: 'Suggest Labels', icon: '🏷️', description: 'Generate relevant tags' },
  { id: 'expand',    label: 'Expand',    icon: '📖', description: 'Add more detail & context' },
]

export default function AiAssistPanel({ getContent, title, onApply, onLabels }: Props) {
  const [open, setOpen]       = useState(false)
  const [usage, setUsage]     = useState<AiUsage | null>(null)
  const [loading, setLoading] = useState<AiAction | null>(null)
  const [result, setResult]   = useState<{ text: string; action: AiAction } | null>(null)
  const [error, setError]     = useState('')
  const [showKeyInput, setShowKeyInput] = useState(false)
  const [keyValue, setKeyValue]         = useState('')
  const [savingKey, setSavingKey]       = useState(false)
  const [keyError, setKeyError]         = useState('')

  useEffect(() => {
    if (open && !usage) {
      aiApi.getUsage().then(r => setUsage(r.data.data)).catch(() => {})
    }
  }, [open, usage])

  const creditsLeft = usage ? (usage.hasOwnKey ? Infinity : usage.requestsLimit - usage.requestsUsed) : null
  const isLimitReached = creditsLeft !== null && creditsLeft <= 0

  async function runAction(action: AiAction) {
    const content = getContent()
    if (!content.replace(/<[^>]*>/g, '').trim()) {
      setError('Add some content to the note first.')
      return
    }
    setLoading(action)
    setResult(null)
    setError('')
    try {
      const res = await aiApi.assist(content, action, title)
      const data = res.data.data
      setResult({ text: data.result, action })
      setUsage(prev => prev ? { ...prev, requestsUsed: data.requestsUsed, hasOwnKey: data.hasOwnKey } : prev)
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { error?: { code?: string; message?: string } } } })
        ?.response?.data?.error
      if (code?.code === 'AI_LIMIT_REACHED') {
        setShowKeyInput(true)
        setError('')
      } else {
        setError(code?.message ?? 'AI request failed. Please try again.')
      }
    } finally {
      setLoading(null)
    }
  }

  async function handleSaveKey() {
    if (!keyValue.trim()) return
    setSavingKey(true)
    setKeyError('')
    try {
      await aiApi.saveKey(keyValue.trim())
      const usageRes = await aiApi.getUsage()
      setUsage(usageRes.data.data)
      setShowKeyInput(false)
      setKeyValue('')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'Invalid API key.'
      setKeyError(msg)
    } finally {
      setSavingKey(false)
    }
  }

  function applyResult() {
    if (!result) return
    if (result.action === 'labels') {
      const labels = result.text.split(',').map(l => l.trim().toLowerCase()).filter(Boolean)
      onLabels(labels)
    } else {
      onApply(result.text)
    }
    setResult(null)
  }

  return (
    <div className="border-t" style={{ borderColor: 'var(--border)' }}>
      {/* Toggle bar */}
      <button
        onClick={() => { setOpen(v => !v); setResult(null); setError('') }}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs transition-colors"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <span className="flex items-center gap-2 font-medium">
          <span>✨</span>
          AI Assistant
          {usage && !usage.hasOwnKey && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
              style={{
                background: creditsLeft === 0 ? 'rgba(239,68,68,0.15)' : 'var(--accent-glow)',
                color: creditsLeft === 0 ? '#f87171' : 'var(--accent-soft)',
              }}
            >
              {creditsLeft === 0 ? 'No credits' : `${creditsLeft}/${usage.requestsLimit} free`}
            </span>
          )}
          {usage?.hasOwnKey && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: 'var(--accent-glow)', color: 'var(--accent-soft)' }}>
              Own key ✓
            </span>
          )}
        </span>
        <span style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">

              {/* Action buttons */}
              {!isLimitReached && !showKeyInput && (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {ACTIONS.map(a => (
                    <button
                      key={a.id}
                      onClick={() => runAction(a.id)}
                      disabled={!!loading}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-left transition-all disabled:opacity-50"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                    >
                      {loading === a.id
                        ? <span className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
                        : <span>{a.icon}</span>
                      }
                      <span className="leading-tight">
                        <span className="block">{a.label}</span>
                        <span className="text-[10px] font-normal opacity-60">{a.description}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs px-3 py-2 rounded-lg"
                    style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Result box */}
              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-xl p-3 space-y-2.5"
                    style={{ background: 'var(--accent-glow)', border: '1px solid var(--border-hover)' }}
                  >
                    {/* Result header */}
                    <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                      {ACTIONS.find(a => a.id === result.action)?.icon}{' '}
                      {ACTIONS.find(a => a.id === result.action)?.label} result
                    </p>

                    {result.action === 'labels' ? (
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                        {result.text.split(',').map(l => l.trim()).filter(Boolean).map(label => (
                          <span
                            key={label}
                            className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                            style={{ background: 'var(--bg-elevated)', color: 'var(--accent-soft)', border: '1px solid var(--border)' }}
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div
                        className="max-h-44 overflow-y-auto pr-1 rounded-lg"
                        style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--border) transparent' }}
                      >
                        <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
                          {result.text}
                        </p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={applyResult}
                        className="btn-accent text-[11px] px-3 py-1.5 rounded-lg"
                      >
                        {result.action === 'labels' ? 'Copy labels ↗' : 'Apply to note'}
                      </button>
                      <button
                        onClick={() => setResult(null)}
                        className="text-[11px] px-3 py-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--text-muted)', background: 'var(--bg-elevated)' }}
                      >
                        Dismiss
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Limit reached / Add own key */}
              {(isLimitReached || showKeyInput) && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl p-3 space-y-2.5"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                >
                  <div>
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                      🔑 Add your Gemini API key
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      You've used all {usage?.requestsLimit} free credits. Paste your own key to keep going — it's free to get at{' '}
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                        style={{ color: 'var(--accent-soft)' }}
                      >
                        aistudio.google.com
                      </a>
                    </p>
                  </div>
                  <input
                    type="password"
                    value={keyValue}
                    onChange={e => { setKeyValue(e.target.value); setKeyError('') }}
                    placeholder="AIzaSy…"
                    className="w-full rounded-lg px-3 py-2 text-xs outline-none"
                    style={{ background: 'var(--bg-root)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  />
                  {keyError && (
                    <p className="text-[11px]" style={{ color: '#f87171' }}>{keyError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveKey}
                      disabled={savingKey || !keyValue.trim()}
                      className="btn-accent text-[11px] px-3 py-1.5 rounded-lg disabled:opacity-50"
                    >
                      {savingKey ? 'Validating…' : 'Save key'}
                    </button>
                    {showKeyInput && !isLimitReached && (
                      <button
                        onClick={() => { setShowKeyInput(false); setKeyValue('') }}
                        className="text-[11px] px-3 py-1.5 rounded-lg"
                        style={{ color: 'var(--text-muted)', background: 'var(--bg-root)' }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
