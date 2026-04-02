'use client'

import { useEffect, useState } from 'react'

interface Particle {
  id: number
  emoji: string
  x: number
  y: number
  size: number
  delay: number
  duration: number
  vx: number
}

const EFFECTS = {
  молдир: {
    emojis: ['🎬', '🎥', '🍿', '⭐', '🌟', '✨', '🎞️'],
    label: 'MOLDIR ✨',
    labelClass: 'text-white',
    glow: 'rgba(255,255,255,0.12)',
    mode: 'fall' as const,
  },
  красавица: {
    emojis: ['💖', '💕', '🌸', '🦋', '💗', '🌺', '💝'],
    label: '💖 Красавица! 💖',
    labelClass: 'text-pink-300',
    glow: 'rgba(255,100,150,0.14)',
    mode: 'rise' as const,
  },
  умничка: {
    emojis: ['⭐', '🌟', '✨', '🎉', '🏆', '🎊', '🥇'],
    label: '⭐ Умничка! ⭐',
    labelClass: 'text-yellow-300',
    glow: 'rgba(255,220,50,0.12)',
    mode: 'burst' as const,
  },
  ура: {
    emojis: ['🎆', '🎇', '🎉', '🎊', '🥳', '🎈', '💥'],
    label: '🎆 УРА! 🎆',
    labelClass: 'text-orange-300',
    glow: 'rgba(255,160,50,0.14)',
    mode: 'burst' as const,
  },
  огонь: {
    emojis: ['🔥', '🔥', '💥', '🌋', '☄️', '🔥', '🔥'],
    label: '🔥 ОГОНЬ 🔥',
    labelClass: 'text-orange-400',
    glow: 'rgba(255,80,0,0.16)',
    mode: 'rise' as const,
  },
  победа: {
    emojis: ['🏆', '🥇', '👑', '🎖️', '🏅', '✨', '💎'],
    label: '🏆 ПОБЕДА! 🏆',
    labelClass: 'text-yellow-400',
    glow: 'rgba(220,180,0,0.14)',
    mode: 'fall' as const,
  },
  казах: {
    emojis: ['🇰🇿', '⭐', '🦅', '🌟', '🇰🇿', '💙', '🌾'],
    label: '🇰🇿 Қазақстан! 🇰🇿',
    labelClass: 'text-sky-300',
    glow: 'rgba(0,150,255,0.14)',
    mode: 'burst' as const,
  },
  вау: {
    emojis: ['😮', '✨', '💫', '🌟', '⚡', '😱', '🤩'],
    label: '✨ ВАУ! ✨',
    labelClass: 'text-purple-300',
    glow: 'rgba(180,100,255,0.14)',
    mode: 'burst' as const,
  },
  счастье: {
    emojis: ['🌈', '☀️', '🌸', '🦋', '🌻', '💛', '🌈'],
    label: '🌈 Счастье! 🌈',
    labelClass: 'text-green-300',
    glow: 'rgba(100,220,100,0.12)',
    mode: 'rise' as const,
  },
  деньги: {
    emojis: ['💰', '💵', '🤑', '💸', '💴', '💎', '💰'],
    label: '💰 Деньги! 💰',
    labelClass: 'text-green-400',
    glow: 'rgba(0,200,80,0.14)',
    mode: 'fall' as const,
  },
  любовь: {
    emojis: ['❤️', '💕', '💞', '💓', '💗', '🥰', '💘'],
    label: '❤️ Любовь! ❤️',
    labelClass: 'text-red-400',
    glow: 'rgba(255,50,80,0.14)',
    mode: 'rise' as const,
  },
  кайф: {
    emojis: ['😎', '🤙', '🎵', '🎶', '💯', '🔥', '✌️'],
    label: '😎 КАЙФ! 😎',
    labelClass: 'text-cyan-300',
    glow: 'rgba(0,200,255,0.12)',
    mode: 'burst' as const,
  },
  ночь: {
    emojis: ['🌙', '⭐', '🌟', '💫', '🌌', '🦉', '✨'],
    label: '🌙 Спокойной ночи 🌙',
    labelClass: 'text-indigo-300',
    glow: 'rgba(100,80,255,0.14)',
    mode: 'fall' as const,
  },
}

export type TriggerKey = keyof typeof EFFECTS

function makeParticles(emojis: string[], count: number, mode: 'fall' | 'rise' | 'burst'): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    emoji: emojis[i % emojis.length],
    x: mode === 'burst' ? 35 + Math.random() * 30 : Math.random() * 100,
    y: mode === 'burst' ? 40 + Math.random() * 20 : 0,
    size: 18 + Math.random() * 28,
    delay: Math.random() * 0.7,
    duration: 1.8 + Math.random() * 1.4,
    vx: (Math.random() - 0.5) * 160,
  }))
}

export function EasterEgg({
  trigger,
  onDone,
}: {
  trigger: TriggerKey | null
  onDone: () => void
}) {
  const [particles, setParticles] = useState<Particle[]>([])
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!trigger) return
    const cfg = EFFECTS[trigger]
    setParticles(makeParticles(cfg.emojis, 45, cfg.mode))
    setVisible(true)
    const fadeTimer = setTimeout(() => setVisible(false), 3000)
    const doneTimer = setTimeout(onDone, 3600)
    return () => { clearTimeout(fadeTimer); clearTimeout(doneTimer) }
  }, [trigger, onDone])

  if (!trigger) return null
  const cfg = EFFECTS[trigger]

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden transition-opacity duration-500"
      style={{
        opacity: visible ? 1 : 0,
        background: `radial-gradient(ellipse at center, ${cfg.glow} 0%, transparent 70%)`,
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={`text-4xl font-bold tracking-tight ${cfg.labelClass} drop-shadow-2xl select-none`}
          style={{
            textShadow: '0 0 40px currentColor, 0 2px 12px rgba(0,0,0,0.9)',
            animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
          }}
        >
          {cfg.label}
        </span>
      </div>

      {particles.map(p => {
        const style: Record<string, string | number> = {
          position: 'absolute',
          fontSize: `${p.size}px`,
          animationDelay: `${p.delay}s`,
          animationDuration: `${p.duration}s`,
          animationFillMode: 'forwards',
          animationTimingFunction: cfg.mode === 'fall' ? 'ease-in' : 'ease-out',
        }
        if (cfg.mode === 'fall') {
          style.left = `${p.x}%`
          style.top = '-60px'
          style.animation = `fall ${p.duration}s ease-in ${p.delay}s forwards`
        } else if (cfg.mode === 'rise') {
          style.left = `${p.x}%`
          style.bottom = '-60px'
          style.animation = `rise ${p.duration}s ease-out ${p.delay}s forwards`
        } else {
          style.left = `${p.x}%`
          style.top = `${p.y}%`
          style.animation = `burst ${p.duration}s ease-out ${p.delay}s forwards`
          style['--vx'] = `${p.vx}px`
        }
        return <span key={p.id} style={style as React.CSSProperties}>{p.emoji}</span>
      })}
    </div>
  )
}

export function detectEasterEgg(text: string): TriggerKey | null {
  const lower = text.toLowerCase()
  for (const key of Object.keys(EFFECTS) as TriggerKey[]) {
    if (lower.includes(key)) return key
  }
  return null
}
