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

const LYRICS_LINES = [
  'Тоқта',
  'Мен жанайын жансам отқа',
  'Сен деп кеуде тостым оққа',
  'Сенде сезім жоқ па',
]

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
  // ── Новые эффекты ─────────────────────────────────────────────────────────
  экг: {
    emojis: [] as string[],
    label: '',
    labelClass: '',
    glow: 'rgba(0,0,0,0)',
    mode: 'ecg' as const,
  },
  флеш: {
    emojis: [] as string[],
    label: '',
    labelClass: '',
    glow: 'rgba(0,0,0,0)',
    mode: 'flash' as const,
  },
  тоқта: {
    emojis: [] as string[],
    label: '',
    labelClass: '',
    glow: 'rgba(160,20,70,0.28)',
    mode: 'lyrics' as const,
  },
}

// Казахские слова без специальных символов → canonical key
const ALIASES: Record<string, keyof typeof EFFECTS> = {
  токта: 'тоқта',
}

export type TriggerKey = keyof typeof EFFECTS

function toParticleMode(mode: string): 'fall' | 'rise' | 'burst' {
  if (mode === 'ecg') return 'rise'
  if (mode === 'flash') return 'burst'
  return mode as 'fall' | 'rise' | 'burst'
}

function makeParticles(emojis: string[], count: number, mode: 'fall' | 'rise' | 'burst'): Particle[] {
  if (emojis.length === 0) return []
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
    const pMode = toParticleMode(cfg.mode)
    setParticles(makeParticles(cfg.emojis, cfg.emojis.length > 0 ? 45 : 0, pMode))
    setVisible(true)
    const fadeDuration = cfg.mode === 'lyrics' ? 8000 : cfg.mode === 'ecg' ? 7000 : cfg.mode === 'flash' ? 4000 : 3000
    const doneDuration = cfg.mode === 'lyrics' ? 8600 : cfg.mode === 'ecg' ? 7600 : cfg.mode === 'flash' ? 4600 : 3600
    const fadeTimer = setTimeout(() => setVisible(false), fadeDuration)
    const doneTimer = setTimeout(onDone, doneDuration)
    return () => { clearTimeout(fadeTimer); clearTimeout(doneTimer) }
  }, [trigger, onDone])

  if (!trigger) return null
  const cfg = EFFECTS[trigger]
  const pMode = toParticleMode(cfg.mode)

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden transition-opacity duration-500"
      style={{
        opacity: visible ? 1 : 0,
        background: cfg.mode === 'ecg'
          ? 'rgba(0,0,0,0.95)'
          : `radial-gradient(ellipse at center, ${cfg.glow} 0%, transparent 70%)`,
      }}
    >
      {/* ── Flash overlay ───────────────────────────────────────────────────── */}
      {cfg.mode === 'flash' && (
        <div
          className="absolute inset-0"
          style={{
            background: '#ffffff',
            animation: 'screenFlash 4s ease-in-out forwards',
          }}
        />
      )}

      {/* ── ECG / Heartbeat ─────────────────────────────────────────────────── */}
      {cfg.mode === 'ecg' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <svg
            viewBox="0 0 1000 200"
            preserveAspectRatio="none"
            className="w-full"
            style={{
              height: '180px',
              filter: 'drop-shadow(0 0 10px #cc0022) drop-shadow(0 0 4px #ff2244)',
            }}
          >
            {/*
              5 ударов через весь экран (0→1000).
              Каждый удар занимает ~200px:
                плоская → P-волна → QRS-пик → S-ямка → T-волна → плоская
            */}
            <path
              d="
                M 0,100
                L 30,100
                  L 42,92 L 52,108 L 64,8 L 76,162 L 88,100
                  L 110,100 L 126,76 L 142,100
                L 200,100
                L 230,100
                  L 242,92 L 252,108 L 264,8 L 276,162 L 288,100
                  L 310,100 L 326,76 L 342,100
                L 400,100
                L 430,100
                  L 442,92 L 452,108 L 464,8 L 476,162 L 488,100
                  L 510,100 L 526,76 L 542,100
                L 600,100
                L 630,100
                  L 642,92 L 652,108 L 664,8 L 676,162 L 688,100
                  L 710,100 L 726,76 L 742,100
                L 800,100
                L 830,100
                  L 842,92 L 852,108 L 864,8 L 876,162 L 888,100
                  L 910,100 L 926,76 L 942,100
                L 1000,100
              "
              fill="none"
              stroke="#ff2244"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: 5000,
                strokeDashoffset: 5000,
                animation: 'ecgDraw 5s linear 0.1s forwards',
              }}
            />
            <circle
              cx="1000" cy="100" r="5"
              fill="#ff2244"
              style={{ animation: 'ecgPulse 0.7s ease-in-out 5.1s infinite' }}
            />
          </svg>
        </div>
      )}

      {/* ── Lyrics ──────────────────────────────────────────────────────────── */}
      {cfg.mode === 'lyrics' && (
        <div className="absolute inset-0 flex items-center justify-center">
          {LYRICS_LINES.map((line, i) => (
            <span
              key={i}
              className="absolute text-2xl font-bold text-center select-none px-10"
              style={{
                color: '#fff',
                opacity: 0,
                textShadow: '0 0 32px rgba(255,80,140,0.9), 0 2px 14px rgba(0,0,0,0.95)',
                animation: `lyricLine 2s ease-in-out ${i * 2}s forwards`,
              }}
            >
              {line}
            </span>
          ))}
        </div>
      )}

      {/* ── Center label (not for ecg / lyrics) ─────────────────────────────── */}
      {cfg.label && cfg.mode !== 'ecg' && cfg.mode !== 'lyrics' && (
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
      )}

      {/* ── Particles ───────────────────────────────────────────────────────── */}
      {particles.map(p => {
        const style: Record<string, string | number> = {
          position: 'absolute',
          fontSize: `${p.size}px`,
          animationFillMode: 'forwards',
        }
        if (pMode === 'fall') {
          style.left = `${p.x}%`
          style.top = '-60px'
          style.animation = `fall ${p.duration}s ease-in ${p.delay}s forwards`
        } else if (pMode === 'rise') {
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
  for (const [alias, key] of Object.entries(ALIASES)) {
    if (lower.includes(alias)) return key
  }
  for (const key of Object.keys(EFFECTS) as TriggerKey[]) {
    if (lower.includes(key)) return key
  }
  return null
}
