'use client'

import { useEffect, useRef } from 'react'

export const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👏']

const EMOJIS = [
  '😀','😂','🥹','😍','🥰','😎','🤩','😏',
  '😒','😔','😭','😤','🤬','😈','🤡','🥸',
  '😴','🤯','🤔','🫡','🤫','😷','🥶','😱',
  '❤️','🧡','💛','💚','💙','💜','🖤','🩷',
  '💕','💞','💝','💔','🫶','❤️‍🔥','💘','🤍',
  '👍','👎','👏','🙌','✌️','🤙','👋','💪',
  '🤝','🫂','🙏','☝️','🤞','🤘','🫵','✊',
  '🔥','⭐','🌟','✨','💫','🎉','🎊','🍿',
  '🏆','💎','🚀','💯','🎯','🌈','💰','🎬',
]

function useClickOutside(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [ref, cb])
}

export function EmojiPicker({
  onSelect,
  onClose,
}: {
  onSelect: (emoji: string) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, onClose)

  return (
    <div
      ref={ref}
      className="absolute bottom-full mb-2 left-0 right-0 rounded-2xl border border-white/[0.08] bg-[#1c1c1c] p-3 shadow-2xl z-20"
    >
      <div className="grid grid-cols-8 gap-0.5">
        {EMOJIS.map((emoji, i) => (
          <button
            key={i}
            onClick={() => onSelect(emoji)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-lg hover:bg-white/[0.1] hover:scale-110 transition-all cursor-pointer select-none"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}

export function ReactionPicker({
  onSelect,
  onClose,
}: {
  onSelect: (emoji: string) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, onClose)

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 mb-1 z-20 flex items-center gap-0.5 rounded-full border border-white/[0.08] bg-[#1c1c1c] px-2 py-1.5 shadow-xl w-max"
    >
      {REACTION_EMOJIS.map(emoji => (
        <button
          key={emoji}
          onClick={() => { onSelect(emoji); onClose() }}
          className="flex h-7 w-7 items-center justify-center rounded-full text-base hover:bg-white/[0.1] hover:scale-125 transition-all cursor-pointer select-none"
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
