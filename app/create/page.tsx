'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FilmSlate, Link, ArrowLeft } from '@phosphor-icons/react'

function genId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

export default function CreateRoom() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [movieUrl, setMovieUrl] = useState('')
  const [urlError, setUrlError] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('moldr_username')
    if (saved) setName(saved)
  }, [])

  const validateUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleUrlChange = (val: string) => {
    setMovieUrl(val)
    if (val && !validateUrl(val)) {
      setUrlError('Введи корректную ссылку')
    } else {
      setUrlError('')
    }
  }

  const create = () => {
    const trimName = name.trim()
    const trimUrl = movieUrl.trim()
    if (!trimName || !trimUrl || !validateUrl(trimUrl)) return
    const roomId = genId()
    localStorage.setItem('moldr_username', trimName)
    localStorage.setItem(`moldir_room_${roomId}`, JSON.stringify({ movieUrl: trimUrl }))
    router.push(`/room/${roomId}`)
  }

  const canCreate = name.trim() && movieUrl.trim() && !urlError && validateUrl(movieUrl.trim())

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#080808] px-4">
      <div className="flex flex-col items-center gap-10 w-full max-w-[380px]">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] border border-white/[0.08]">
            <FilmSlate size={22} weight="fill" className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-white text-2xl font-semibold tracking-tight">Новая комната</h1>
            <p className="text-zinc-600 text-sm mt-0.5">Добавь ссылку на фильм</p>
          </div>
        </div>

        {/* Card */}
        <div className="w-full rounded-2xl border border-white/[0.07] bg-[#111] p-6 flex flex-col gap-4">

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-zinc-500 text-xs">Твоё имя</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Введи имя..."
              className="w-full rounded-xl bg-white/[0.05] border border-white/[0.07] px-4 py-3 text-white placeholder:text-zinc-700 text-sm outline-none focus:border-white/[0.18] transition-colors"
            />
          </div>

          {/* Movie URL */}
          <div className="flex flex-col gap-1.5">
            <label className="text-zinc-500 text-xs">Ссылка на фильм</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none">
                <Link size={14} />
              </div>
              <input
                autoFocus
                value={movieUrl}
                onChange={e => handleUrlChange(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') create() }}
                placeholder="https://..."
                className={`w-full rounded-xl bg-white/[0.05] border px-4 py-3 pl-9 text-white placeholder:text-zinc-700 text-sm outline-none transition-colors ${
                  urlError
                    ? 'border-red-500/40 focus:border-red-500/60'
                    : 'border-white/[0.07] focus:border-white/[0.18]'
                }`}
              />
            </div>
            {urlError && (
              <p className="text-red-400 text-xs">{urlError}</p>
            )}
            <p className="text-zinc-700 text-xs leading-relaxed">
              Прямая ссылка на видеофайл (.mp4, .m3u8) или стриминг
            </p>
          </div>

          <button
            disabled={!canCreate}
            onClick={create}
            className="w-full rounded-xl bg-white py-3 text-sm font-semibold text-black transition-opacity disabled:opacity-20 hover:opacity-90 cursor-pointer disabled:cursor-default mt-1"
          >
            Создать комнату
          </button>
        </div>

        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-zinc-700 hover:text-zinc-400 text-xs transition-colors cursor-pointer"
        >
          <ArrowLeft size={12} />
          Назад
        </button>

      </div>
    </div>
  )
}
