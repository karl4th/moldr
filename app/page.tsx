'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FilmSlate, Plus, SignIn } from '@phosphor-icons/react'

export default function Home() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')

  const join = () => {
    const trimName = name.trim()
    const roomId = code.trim().toUpperCase()
    if (!trimName || roomId.length < 4) return
    localStorage.setItem('moldr_username', trimName)
    router.push(`/room/${roomId}`)
  }

  const goCreate = () => {
    const trimName = name.trim()
    if (!trimName) return
    localStorage.setItem('moldr_username', trimName)
    router.push('/create')
  }

  const canJoin = name.trim() && code.trim().length >= 4
  const canCreate = name.trim()

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
              onKeyDown={e => { if (e.key === 'Enter') join() }}
              placeholder="Введи имя..."
              className="w-full rounded-xl bg-white/[0.05] border border-white/[0.07] px-4 py-3 text-white placeholder:text-zinc-700 text-sm outline-none focus:border-white/[0.18] transition-colors"
            />
          </div>

          {/* Room code */}
          <div className="flex flex-col gap-1.5">
            <label className="text-zinc-500 text-xs">Код комнаты</label>
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => { if (e.key === 'Enter') join() }}
              placeholder="Напр. A3BC9D"
              maxLength={6}
              className="w-full rounded-xl bg-white/[0.05] border border-white/[0.07] px-4 py-3 text-white placeholder:text-zinc-700 text-sm outline-none focus:border-white/[0.18] transition-colors tracking-[0.2em] font-mono uppercase"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-1">
            <button
              disabled={!canCreate}
              onClick={goCreate}
              className="flex items-center justify-center gap-1.5 flex-1 rounded-xl border border-white/[0.1] bg-white/[0.05] py-3 text-sm font-medium text-zinc-300 transition-all disabled:opacity-20 hover:bg-white/[0.08] hover:text-white cursor-pointer disabled:cursor-default"
            >
              <Plus size={14} weight="bold" />
              Создать
            </button>
            <button
              disabled={!canJoin}
              onClick={join}
              className="flex items-center justify-center gap-1.5 flex-1 rounded-xl bg-white py-3 text-sm font-semibold text-black transition-opacity disabled:opacity-20 hover:opacity-90 cursor-pointer disabled:cursor-default"
            >
              <SignIn size={14} weight="bold" />
              Войти
            </button>
          </div>
        </div>

        <p className="text-zinc-700 text-xs text-center">
          moldir.space — синхронный просмотр
        </p>
      </div>
    </div>
  )
}
