'use client'

import { useEffect, useState, useCallback } from 'react'

interface Particle {
  id: number
  emoji: string
  x: number
  y: number
  size: number
  delay: number
  duration: number
  vx: number // horizontal drift
}

const EFFECTS = {
  молдир: {
    emojis: ['🎬', '🎥', '🍿', '⭐', '🌟', '✨', '🎞️'],
    label: 'MOLDIR',
    sublabel: '✨',
    labelClass: 'text-white',
    glowColor: 'rgba(255,255,255,0.15)',
    mode: 'fall' as const,
  },
  красавица: {
    emojis: ['💖', '💕', '🌸', '🦋', '💗', '🌺', '💝'],
    label: 'Красавица!',
    sublabel: '💖',
    labelClass: 'text-pink-300',
    glowColor: 'rgba(255,100,150,0.15)',
    mode: 'rise' as const,
  },
  умничка: {
    emojis: ['⭐', '🌟', '✨', '🎉', '🏆', '🎊', '🥇'],
    label: 'Умничка!',
    sublabel: '⭐',
    labelClass: 'text-yellow-300',
    glowColor: 'rgba(255,220,50,0.12)',
    mode: 'burst' as const,
  },
}

type TriggerKey = keyof typeof EFFECTS

function makeParticles(emojis: string[], count: number, mode: 'fall' | 'rise' | 'burst'): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const isBurst = mode === 'burst'
    return {
      id: i,
      emoji: emojis[i % emojis.length],
      x: isBurst ? 35 + Math.random() * 30 : Math.random() * 100,
      y: isBurst ? 40 + Math.random() * 20 : 0,
      size: 18 + Math.random() * 28,
      delay: Math.random() * 0.6,
      duration: 1.8 + Math.random() * 1.4,
      vx: (Math.random() - 0.5) * 120, // px drift left/right
    }
  })
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
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(doneTimer)
    }
  }, [trigger, onDone])

  if (!trigger) return null
  const cfg = EFFECTS[trigger]

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0, background: `radial-gradient(ellipse at center, ${cfg.glowColor} 0%, transparent 70%)` }}
    >
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 select-none">
        <span
          className={`text-5xl font-bold tracking-tight ${cfg.labelClass} drop-shadow-2xl`}
          style={{
            textShadow: '0 0 40px currentColor, 0 2px 8px rgba(0,0,0,0.8)',
            animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
          }}
        >
          {cfg.sublabel} {cfg.label} {cfg.sublabel}
        </span>
      </div>

      {/* Particles */}
      {particles.map(p => {
        const style: React.CSSProperties = {
          position: 'absolute',
          fontSize: `${p.size}px`,
          animationDelay: `${p.delay}s`,
          animationDuration: `${p.duration}s`,
          animationFillMode: 'forwards',
          animationTimingFunction: 'ease-out',
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
          // burst from center
          style.left = `${p.x}%`
          style.top = `${p.y}%`
          style.animation = `burst ${p.duration}s ease-out ${p.delay}s forwards`
          ;(style as Record<string, string | number>)['--vx'] = `${p.vx}px`
        }

        return (
          <span key={p.id} style={style}>
            {p.emoji}
          </span>
        )
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
