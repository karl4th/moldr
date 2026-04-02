'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import {
  FilmSlate,
  PaperPlaneTilt,
  Users,
  CopySimple,
  Check,
} from '@phosphor-icons/react'

const MOVIE_URL =
  'https://pulse.host.cinemap.cc/c3f4c1ea1d2ecb43cca9ac9805d71849:2026040216/movies/9862e8fbdffb2f85b551de3c31ee31bd9500a062/720.mp4'

interface Message {
  id: string
  user: string
  text: string
  time: string
}

function ts() {
  const d = new Date()
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function RoomPage() {
  const { id: roomId } = useParams<{ id: string }>()
  const router = useRouter()

  const [username, setUsername] = useState<string | null>(null)
  const [nameInput, setNameInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [chatText, setChatText] = useState('')
  const [online, setOnline] = useState(0)
  const [copied, setCopied] = useState(false)
  const [connected, setConnected] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  // Prevents re-broadcasting events triggered by remote sync
  const syncLock = useRef(false)
  // Ensures we only apply the first sync_res we receive
  const didSync = useRef(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Load username on mount
  useEffect(() => {
    const saved = localStorage.getItem('moldir_username')
    if (saved) setUsername(saved)
  }, [])

  // Auto-scroll chat to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Connect to Supabase Realtime when username is ready
  useEffect(() => {
    if (!username || !roomId) return

    const ch = supabase.channel(`room:${roomId}`, {
      config: { broadcast: { self: false }, presence: { key: username } },
    })
    channelRef.current = ch

    // ── Video sync ───────────────────────────────────────────────────────────
    ch.on('broadcast', { event: 'video' }, ({ payload }) => {
      const v = videoRef.current
      if (!v) return

      syncLock.current = true

      const apply = async () => {
        try {
          if (payload.action === 'seek' || payload.action === 'play') {
            v.currentTime = payload.time
          }
          if (payload.action === 'play') await v.play()
          else if (payload.action === 'pause') v.pause()
        } catch {
          // Autoplay blocked — user needs to interact first
        } finally {
          setTimeout(() => { syncLock.current = false }, 200)
        }
      }
      apply()
    })

    // ── Sync request: someone joined and wants current state ─────────────────
    ch.on('broadcast', { event: 'sync_req' }, () => {
      const v = videoRef.current
      if (!v) return
      ch.send({
        type: 'broadcast',
        event: 'sync_res',
        payload: { time: v.currentTime, paused: v.paused },
      })
    })

    // ── Sync response: we just joined, apply state ───────────────────────────
    ch.on('broadcast', { event: 'sync_res' }, ({ payload }) => {
      if (didSync.current) return
      didSync.current = true

      const v = videoRef.current
      if (!v) return

      syncLock.current = true
      v.currentTime = payload.time

      if (!payload.paused) {
        v.play()
          .catch(() => {})
          .finally(() => { setTimeout(() => { syncLock.current = false }, 200) })
      } else {
        setTimeout(() => { syncLock.current = false }, 200)
      }
    })

    // ── Chat ─────────────────────────────────────────────────────────────────
    ch.on('broadcast', { event: 'chat' }, ({ payload }) => {
      setMessages(prev => [...prev, payload as Message])
    })

    // ── Presence: track online users ─────────────────────────────────────────
    ch.on('presence', { event: 'sync' }, () => {
      setOnline(Object.keys(ch.presenceState()).length)
    })
    ch.on('presence', { event: 'join' }, () => {
      setOnline(Object.keys(ch.presenceState()).length)
    })
    ch.on('presence', { event: 'leave' }, () => {
      setOnline(Object.keys(ch.presenceState()).length)
    })

    ch.subscribe(async (status) => {
      if (status !== 'SUBSCRIBED') return

      setConnected(true)

      await ch.track({ username, at: Date.now() })

      // Ask others for current video state
      ch.send({ type: 'broadcast', event: 'sync_req', payload: {} })

      // If alone in room after 2s, no sync needed
      setTimeout(() => { didSync.current = true }, 2000)
    })

    return () => {
      supabase.removeChannel(ch)
    }
  }, [username, roomId])

  // ── Broadcast local video actions ────────────────────────────────────────
  const broadcastVideo = (action: 'play' | 'pause' | 'seek') => {
    if (syncLock.current) return
    const v = videoRef.current
    if (!v) return
    channelRef.current?.send({
      type: 'broadcast',
      event: 'video',
      payload: { action, time: v.currentTime },
    })
  }

  const sendMessage = () => {
    const trimmed = chatText.trim()
    if (!trimmed || !username) return
    const msg: Message = {
      id: crypto.randomUUID(),
      user: username,
      text: trimmed,
      time: ts(),
    }
    channelRef.current?.send({ type: 'broadcast', event: 'chat', payload: msg })
    setMessages(prev => [...prev, msg])
    setChatText('')
  }

  const copyInvite = () => {
    navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const setName = () => {
    const t = nameInput.trim()
    if (!t) return
    localStorage.setItem('moldir_username', t)
    setUsername(t)
  }

  // ── Name gate ────────────────────────────────────────────────────────────
  if (!username) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#080808] px-4">
        <div className="flex flex-col items-center gap-8 w-full max-w-[360px]">
          <div className="flex items-center gap-2">
            <FilmSlate size={22} weight="fill" className="text-white" />
            <span className="text-white text-xl font-semibold tracking-tight">moldir</span>
          </div>
          <div className="w-full rounded-2xl border border-white/[0.07] bg-[#111] p-6 flex flex-col gap-4">
            <div>
              <p className="text-white font-medium">Как тебя зовут?</p>
              <p className="text-zinc-600 text-sm mt-0.5">Тебя пригласили в комнату <span className="text-zinc-400 font-mono">{roomId}</span></p>
            </div>
            <input
              autoFocus
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') setName() }}
              placeholder="Введи имя..."
              className="w-full rounded-xl bg-white/[0.05] border border-white/[0.07] px-4 py-3 text-white placeholder:text-zinc-700 text-sm outline-none focus:border-white/[0.18] transition-colors"
            />
            <button
              disabled={!nameInput.trim()}
              onClick={setName}
              className="w-full rounded-xl bg-white py-3 text-sm font-semibold text-black transition-opacity disabled:opacity-20 hover:opacity-90 cursor-pointer disabled:cursor-default"
            >
              Войти в комнату
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Main room ─────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen flex-col bg-[#080808] overflow-hidden">

      {/* Header */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-white/[0.06] px-4">
        <div className="flex items-center gap-2.5">
          <FilmSlate size={16} weight="fill" className="text-white" />
          <span className="text-white text-sm font-semibold tracking-tight">moldir</span>
          <span className="text-zinc-700 text-xs font-mono ml-1">{roomId}</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Online indicator */}
          <div className="flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                connected ? 'bg-emerald-500' : 'bg-zinc-700'
              }`}
            />
            <Users size={12} className="text-zinc-600" />
            <span className="text-zinc-600 text-xs tabular-nums">{online}</span>
          </div>

          {/* Copy invite */}
          <button
            onClick={copyInvite}
            className="flex items-center gap-1.5 text-zinc-500 hover:text-white text-xs transition-colors cursor-pointer select-none"
          >
            {copied ? (
              <>
                <Check size={13} className="text-emerald-400" />
                <span className="text-emerald-400">Скопировано</span>
              </>
            ) : (
              <>
                <CopySimple size={13} />
                <span>Пригласить</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">

        {/* Video */}
        <div className="flex flex-1 items-center justify-center bg-black">
          <video
            ref={videoRef}
            src={MOVIE_URL}
            controls
            className="h-full w-full object-contain"
            onPlay={() => broadcastVideo('play')}
            onPause={() => broadcastVideo('pause')}
            onSeeked={() => broadcastVideo('seek')}
          />
        </div>

        {/* Chat */}
        <aside className="flex w-[300px] shrink-0 flex-col border-l border-white/[0.06] bg-[#0d0d0d]">

          {/* Chat header */}
          <div className="flex h-10 shrink-0 items-center border-b border-white/[0.06] px-4">
            <span className="text-zinc-600 text-[10px] font-medium uppercase tracking-[0.12em]">Чат</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 scrollbar-thin">
            {messages.length === 0 && (
              <p className="text-zinc-800 text-xs text-center mt-12 leading-5">
                Пока тихо.<br />Напиши первым!
              </p>
            )}
            {messages.map(msg => {
              const isMe = msg.user === username
              return (
                <div key={msg.id} className="flex flex-col gap-0.5">
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-[11px] font-semibold ${isMe ? 'text-white' : 'text-zinc-400'}`}>
                      {isMe ? 'Ты' : msg.user}
                    </span>
                    <span className="text-zinc-700 text-[10px]">{msg.time}</span>
                  </div>
                  <p className="text-zinc-300 text-sm leading-relaxed break-words">{msg.text}</p>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-white/[0.06] p-3">
            <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.06] px-3 py-2.5 focus-within:border-white/[0.14] transition-colors">
              <input
                value={chatText}
                onChange={e => setChatText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendMessage() }}
                placeholder="Сообщение..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-700 outline-none"
              />
              <button
                onClick={sendMessage}
                disabled={!chatText.trim()}
                className="text-zinc-600 hover:text-white disabled:opacity-20 transition-colors cursor-pointer disabled:cursor-default"
              >
                <PaperPlaneTilt size={15} weight="fill" />
              </button>
            </div>
          </div>

        </aside>
      </div>
    </div>
  )
}
