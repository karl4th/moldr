'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { FilmSlate, PaperPlaneTilt, Users, CopySimple, Check, Smiley, ArrowLeft } from '@phosphor-icons/react'
import { EasterEgg, detectEasterEgg } from './easter-egg'
import { EmojiPicker, ReactionPicker } from './emoji-picker'

interface Message {
  id: string
  user: string
  text: string
  time: string
}

type ReactionMap = Record<string, Record<string, string[]>>

function ts() {
  const d = new Date()
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function RoomPage() {
  const { id: roomId } = useParams<{ id: string }>()
  const router = useRouter()

  const [username, setUsername] = useState<string | null>(null)
  const [nameInput, setNameInput] = useState('')
  const [movieUrl, setMovieUrl] = useState<string | null>(null)
  const [roomNotFound, setRoomNotFound] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [chatText, setChatText] = useState('')
  const [online, setOnline] = useState(0)
  const [copied, setCopied] = useState(false)
  const [connected, setConnected] = useState(false)
  const [easterEgg, setEasterEgg] = useState<ReturnType<typeof detectEasterEgg>>(null)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [reactionMap, setReactionMap] = useState<ReactionMap>({})
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null)
  const [hoveredMsg, setHoveredMsg] = useState<string | null>(null)
  const [typingUsers, setTypingUsers] = useState<string[]>([])

  const videoRef = useRef<HTMLVideoElement>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const syncLock = useRef(false)
  const didSync = useRef(false)
  const movieUrlRef = useRef<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep ref in sync with state
  useEffect(() => { movieUrlRef.current = movieUrl }, [movieUrl])

  // Load username + movie URL from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('moldr_username')
    if (saved) setUsername(saved)

    const roomData = localStorage.getItem(`moldir_room_${roomId}`)
    if (roomData) {
      try {
        const { movieUrl: url } = JSON.parse(roomData)
        movieUrlRef.current = url
        setMovieUrl(url)
      } catch { /* ignore */ }
    }
  }, [roomId])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Supabase Realtime
  useEffect(() => {
    if (!username || !roomId) return

    const ch = supabase.channel(`room:${roomId}`, {
      config: { broadcast: { self: false }, presence: { key: username } },
    })
    channelRef.current = ch

    // Video sync
    ch.on('broadcast', { event: 'video' }, ({ payload }) => {
      const v = videoRef.current
      if (!v) return
      syncLock.current = true
      const apply = async () => {
        try {
          if (payload.action === 'seek' || payload.action === 'play') v.currentTime = payload.time
          if (payload.action === 'play') await v.play()
          else if (payload.action === 'pause') v.pause()
        } catch { /* autoplay blocked */ }
        finally { setTimeout(() => { syncLock.current = false }, 200) }
      }
      apply()
    })

    ch.on('broadcast', { event: 'sync_req' }, () => {
      const v = videoRef.current
      if (!v) return
      ch.send({
        type: 'broadcast',
        event: 'sync_res',
        payload: { time: v.currentTime, paused: v.paused, movieUrl: movieUrlRef.current },
      })
    })

    ch.on('broadcast', { event: 'sync_res' }, ({ payload }) => {
      // Grab movie URL from whoever has it
      if (payload.movieUrl && !movieUrlRef.current) {
        movieUrlRef.current = payload.movieUrl
        setMovieUrl(payload.movieUrl)
      }
      if (didSync.current) return
      didSync.current = true
      const v = videoRef.current
      if (!v) return
      syncLock.current = true
      v.currentTime = payload.time
      if (!payload.paused) {
        v.play().catch(() => {}).finally(() => { setTimeout(() => { syncLock.current = false }, 200) })
      } else {
        setTimeout(() => { syncLock.current = false }, 200)
      }
    })

    // Chat
    ch.on('broadcast', { event: 'chat' }, ({ payload }) => {
      setMessages(prev => [...prev, payload as Message])
      const egg = detectEasterEgg((payload as Message).text)
      if (egg) setEasterEgg(egg)
    })

    // Typing
    ch.on('broadcast', { event: 'typing' }, ({ payload }) => {
      setTypingUsers(prev =>
        payload.typing
          ? prev.includes(payload.username) ? prev : [...prev, payload.username]
          : prev.filter((u: string) => u !== payload.username)
      )
    })

    // Reactions
    ch.on('broadcast', { event: 'reaction' }, ({ payload }) => {
      applyReaction(payload.messageId, payload.emoji, payload.username)
    })

    // Presence — try to pick up movieUrl from others already in the room
    ch.on('presence', { event: 'sync' }, () => {
      setOnline(Object.keys(ch.presenceState()).length)
      if (!movieUrlRef.current) {
        for (const users of Object.values(ch.presenceState())) {
          for (const u of users as Array<{ movieUrl?: string }>) {
            if (u.movieUrl) {
              movieUrlRef.current = u.movieUrl
              setMovieUrl(u.movieUrl)
              break
            }
          }
        }
      }
    })
    ch.on('presence', { event: 'join' }, () => setOnline(Object.keys(ch.presenceState()).length))
    ch.on('presence', { event: 'leave' }, () => setOnline(Object.keys(ch.presenceState()).length))

    ch.subscribe(async (status) => {
      if (status !== 'SUBSCRIBED') return
      setConnected(true)

      const trackPayload: Record<string, unknown> = { username, at: Date.now() }
      if (movieUrlRef.current) trackPayload.movieUrl = movieUrlRef.current
      await ch.track(trackPayload)

      ch.send({ type: 'broadcast', event: 'sync_req', payload: {} })
      setTimeout(() => { didSync.current = true }, 2000)

      // Room not found: after 3s, if still no movieUrl and no other users → dead room
      setTimeout(() => {
        if (movieUrlRef.current) return
        const others = Object.values(ch.presenceState())
          .flat()
          .filter((u: unknown) => (u as { username?: string }).username !== username)
        if (others.length === 0) setRoomNotFound(true)
      }, 3000)
    })

    return () => { supabase.removeChannel(ch) }
  }, [username, roomId])

  const applyReaction = (messageId: string, emoji: string, user: string) => {
    setReactionMap(prev => {
      const msgR = { ...(prev[messageId] || {}) }
      const users = [...(msgR[emoji] || [])]
      const idx = users.indexOf(user)
      if (idx >= 0) users.splice(idx, 1)
      else users.push(user)
      if (users.length === 0) delete msgR[emoji]
      else msgR[emoji] = users
      return { ...prev, [messageId]: msgR }
    })
  }

  const handleReaction = (messageId: string, emoji: string) => {
    if (!username) return
    applyReaction(messageId, emoji, username)
    channelRef.current?.send({
      type: 'broadcast',
      event: 'reaction',
      payload: { messageId, emoji, username },
    })
    setReactionPickerFor(null)
  }

  const broadcastVideo = (action: 'play' | 'pause' | 'seek') => {
    if (syncLock.current) return
    const v = videoRef.current
    if (!v) return
    channelRef.current?.send({ type: 'broadcast', event: 'video', payload: { action, time: v.currentTime } })
  }

  const sendMessage = () => {
    const trimmed = chatText.trim()
    if (!trimmed || !username) return
    const msg: Message = { id: crypto.randomUUID(), user: username, text: trimmed, time: ts() }
    channelRef.current?.send({ type: 'broadcast', event: 'chat', payload: msg })
    setMessages(prev => [...prev, msg])
    setChatText('')
    stopTyping()
    const egg = detectEasterEgg(trimmed)
    if (egg) setEasterEgg(egg)
  }

  const stopTyping = () => {
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
    channelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { username, typing: false } })
  }

  const handleChatInput = (value: string) => {
    setChatText(value)
    if (!channelRef.current || !username) return
    channelRef.current.send({ type: 'broadcast', event: 'typing', payload: { username, typing: true } })
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(stopTyping, 2000)
  }

  const insertEmoji = (emoji: string) => {
    setChatText(prev => prev + emoji)
    setEmojiOpen(false)
    inputRef.current?.focus()
  }

  const copyInvite = () => {
    navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const joinWithName = () => {
    const t = nameInput.trim()
    if (!t) return
    localStorage.setItem('moldr_username', t)
    setUsername(t)
  }

  // ── Room not found ─────────────────────────────────────────────────────────
  if (roomNotFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#080808] px-4">
        <div className="flex flex-col items-center gap-8 w-full max-w-[360px] text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] border border-white/[0.08]">
            <FilmSlate size={22} weight="fill" className="text-zinc-600" />
          </div>
          <div>
            <p className="text-white font-semibold text-lg">Комната не найдена</p>
            <p className="text-zinc-600 text-sm mt-1.5 leading-relaxed">
              Комнаты <span className="font-mono text-zinc-400">{roomId}</span> не существует<br />или создатель уже вышел
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full">
            <button
              onClick={() => router.push('/create')}
              className="w-full rounded-xl bg-white py-3 text-sm font-semibold text-black hover:opacity-90 transition-opacity cursor-pointer"
            >
              Создать новую комнату
            </button>
            <button
              onClick={() => router.push('/')}
              className="flex items-center justify-center gap-1.5 w-full rounded-xl border border-white/[0.08] py-3 text-sm text-zinc-500 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft size={13} />
              На главную
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Name gate ─────────────────────────────────────────────────────────────
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
              <p className="text-zinc-600 text-sm mt-0.5">
                Тебя пригласили в комнату <span className="text-zinc-400 font-mono">{roomId}</span>
              </p>
            </div>
            <input
              autoFocus
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') joinWithName() }}
              placeholder="Введи имя..."
              className="w-full rounded-xl bg-white/[0.05] border border-white/[0.07] px-4 py-3 text-white placeholder:text-zinc-700 text-sm outline-none focus:border-white/[0.18] transition-colors"
            />
            <button
              disabled={!nameInput.trim()}
              onClick={joinWithName}
              className="w-full rounded-xl bg-white py-3 text-sm font-semibold text-black transition-opacity disabled:opacity-20 hover:opacity-90 cursor-pointer disabled:cursor-default"
            >
              Войти в комнату
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Main room ──────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen flex-col bg-[#080808] overflow-hidden">
      <EasterEgg trigger={easterEgg} onDone={() => setEasterEgg(null)} />

      {/* Header */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-white/[0.06] px-4">
        <div className="flex items-center gap-2.5">
          <FilmSlate size={16} weight="fill" className="text-white" />
          <span className="text-white text-sm font-semibold tracking-tight">moldir</span>
          <span className="text-zinc-700 text-xs font-mono ml-1">{roomId}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full transition-colors ${connected ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
            <Users size={12} className="text-zinc-600" />
            <span className="text-zinc-600 text-xs tabular-nums">{online}</span>
          </div>
          <button onClick={copyInvite} className="flex items-center gap-1.5 text-zinc-500 hover:text-white text-xs transition-colors cursor-pointer select-none">
            {copied
              ? <><Check size={13} className="text-emerald-400" /><span className="text-emerald-400">Скопировано</span></>
              : <><CopySimple size={13} /><span>Пригласить</span></>}
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">

        {/* Video */}
        <div className="flex flex-1 items-center justify-center bg-black">
          {movieUrl ? (
            <video
              ref={videoRef}
              src={movieUrl}
              controls
              className="h-full w-full object-contain"
              onPlay={() => broadcastVideo('play')}
              onPause={() => broadcastVideo('pause')}
              onSeeked={() => broadcastVideo('seek')}
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-zinc-700">
              <div className="h-5 w-5 rounded-full border-2 border-zinc-700 border-t-zinc-400 animate-spin" />
              <span className="text-xs">Подключаемся...</span>
            </div>
          )}
        </div>

        {/* Chat */}
        <aside className="flex w-[300px] shrink-0 flex-col border-l border-white/[0.06] bg-[#0d0d0d]">

          <div className="flex h-10 shrink-0 items-center border-b border-white/[0.06] px-4">
            <span className="text-zinc-600 text-[10px] font-medium uppercase tracking-[0.12em]">Чат</span>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-3 scrollbar-thin"
            onClick={() => { setReactionPickerFor(null); setEmojiOpen(false) }}
          >
            {messages.length === 0 && (
              <p className="text-zinc-800 text-xs text-center mt-12 leading-5">Пока тихо.<br />Напиши первым!</p>
            )}
            {messages.map(msg => {
              const isMe = msg.user === username
              const reactions = reactionMap[msg.id] || {}
              const hasReactions = Object.keys(reactions).length > 0

              return (
                <div
                  key={msg.id}
                  className="relative group flex flex-col gap-0.5"
                  onMouseEnter={() => setHoveredMsg(msg.id)}
                  onMouseLeave={() => setHoveredMsg(null)}
                >
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-[11px] font-semibold ${isMe ? 'text-white' : 'text-zinc-400'}`}>
                      {isMe ? 'Ты' : msg.user}
                    </span>
                    <span className="text-zinc-700 text-[10px]">{msg.time}</span>
                  </div>

                  <p className="text-zinc-300 text-sm leading-relaxed break-words pr-5">{msg.text}</p>

                  {(hoveredMsg === msg.id || reactionPickerFor === msg.id) && (
                    <button
                      onClick={e => { e.stopPropagation(); setReactionPickerFor(reactionPickerFor === msg.id ? null : msg.id) }}
                      className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-md text-zinc-600 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer text-xs"
                    >
                      +
                    </button>
                  )}

                  {reactionPickerFor === msg.id && (
                    <ReactionPicker
                      onSelect={emoji => handleReaction(msg.id, emoji)}
                      onClose={() => setReactionPickerFor(null)}
                    />
                  )}

                  {hasReactions && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(reactions).map(([emoji, users]) => {
                        const iReacted = username ? users.includes(username) : false
                        return (
                          <button
                            key={emoji}
                            onClick={e => { e.stopPropagation(); handleReaction(msg.id, emoji) }}
                            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border transition-all cursor-pointer select-none ${
                              iReacted
                                ? 'bg-white/[0.1] border-white/[0.2] text-white'
                                : 'bg-white/[0.03] border-white/[0.07] text-zinc-400 hover:border-white/[0.15]'
                            }`}
                          >
                            <span>{emoji}</span>
                            <span className="tabular-nums">{users.length}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Typing indicator */}
          <div className="h-6 shrink-0 flex items-center px-4">
            {typingUsers.length > 0 && (
              <span className="text-zinc-600 text-xs flex items-center gap-1.5">
                <span className="flex gap-0.5">
                  <span className="typing-dot" />
                  <span className="typing-dot" style={{ animationDelay: '0.15s' }} />
                  <span className="typing-dot" style={{ animationDelay: '0.3s' }} />
                </span>
                {typingUsers.length === 1
                  ? `${typingUsers[0]} печатает`
                  : `${typingUsers.slice(0, 2).join(' и ')} печатают`}
              </span>
            )}
          </div>

          {/* Input area */}
          <div className="shrink-0 border-t border-white/[0.06] p-3">
            <div className="relative">
              {emojiOpen && (
                <EmojiPicker
                  onSelect={insertEmoji}
                  onClose={() => setEmojiOpen(false)}
                />
              )}
              <div className="flex items-center gap-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] px-2.5 py-2 focus-within:border-white/[0.14] transition-colors">
                <button
                  onClick={() => setEmojiOpen(o => !o)}
                  className={`shrink-0 transition-colors cursor-pointer ${emojiOpen ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
                >
                  <Smiley size={16} />
                </button>
                <input
                  ref={inputRef}
                  value={chatText}
                  onChange={e => handleChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') sendMessage() }}
                  placeholder="Сообщение..."
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-700 outline-none"
                />
                <button
                  onClick={sendMessage}
                  disabled={!chatText.trim()}
                  className="shrink-0 text-zinc-600 hover:text-white disabled:opacity-20 transition-colors cursor-pointer disabled:cursor-default"
                >
                  <PaperPlaneTilt size={15} weight="fill" />
                </button>
              </div>
            </div>
          </div>

        </aside>
      </div>
    </div>
  )
}
