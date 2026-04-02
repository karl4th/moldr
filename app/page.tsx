'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FilmSlate } from '@phosphor-icons/react'

function genId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

export default function Home() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [mode, setMode] = useState<'create' | 'join'>('create')

  const enter = () => {
    const trimName = name.trim()
    const roomId = mode === 'create' ? genId() : code.trim().toUpperCase()
    if (!trimName || !roomId) return
    localStorage.setItem('moldir_username', trimName)
    router.push(`/room/${roomId}`)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#080808] px-4">
      <div className="flex flex-col items-center gap-10 w-full max-w-[380px]">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] border border-white/[0.08]">
            <FilmSlate size={22} weight="fill" className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-white text-2xl font-semibold tracking-tight">moldir</h1>
            <p className="text-zinc-600 text-sm mt-0.5">Смотри фильмы вместе с друзьями</p>
          </div>
        </div>

        {/* Card */}
        <div className="w-full rounded-2xl border border-white/[0.07] bg-[#111] p-6 flex flex-col gap-4">

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-zinc-500 text-xs">Твоё имя</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') enter() }}
              placeholder="Введи имя..."
              className="w-full rounded-xl bg-white/[0.05] border border-white/[0.07] px-4 py-3 text-white placeholder:text-zinc-700 text-sm outline-none focus:border-white/[0.18] transition-colors"
            />
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-xl bg-white/[0.04] p-1 gap-1">
            {(['create', 'join'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 rounded-[10px] py-2 text-xs font-medium transition-all cursor-pointer select-none ${
                  mode === m
                    ? 'bg-white text-black shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-400'
                }`}
              >
                {m === 'create' ? 'Создать комнату' : 'Войти по коду'}
              </button>
            ))}
          </div>

          {/* Room code input */}
          {mode === 'join' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-zinc-500 text-xs">Код комнаты</label>
              <input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                onKeyDown={e => { if (e.key === 'Enter') enter() }}
                placeholder="Напр. A3BC9D"
                maxLength={6}
                className="w-full rounded-xl bg-white/[0.05] border border-white/[0.07] px-4 py-3 text-white placeholder:text-zinc-700 text-sm outline-none focus:border-white/[0.18] transition-colors tracking-[0.2em] font-mono uppercase"
              />
            </div>
          )}

          <button
            disabled={!name.trim() || (mode === 'join' && code.trim().length < 4)}
            onClick={enter}
            className="w-full rounded-xl bg-white py-3 text-sm font-semibold text-black transition-opacity disabled:opacity-20 hover:opacity-90 cursor-pointer disabled:cursor-default mt-1"
          >
            {mode === 'create' ? 'Создать и войти' : 'Войти в комнату'}
          </button>
        </div>

        <p className="text-zinc-700 text-xs text-center">
          moldir.space — синхронный просмотр
        </p>
      </div>
    </div>
  )
}
