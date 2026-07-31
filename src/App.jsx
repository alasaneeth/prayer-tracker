import { useState, useEffect, useMemo, useRef } from 'react'

const STORAGE_KEY = 'prayerTrackerData_rolling48'
const WINDOW_SIZE = 48 // மொத்தம் இத்தனை நாட்கள் தொடர்ந்து காட்டப்படும்
const MOTIVATION_MESSAGE = 'அல்லாஹ் உங்களை பொருந்திக்கொள்வானாக'

function getTodayStr() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const PRAYERS = [
  { id: 'fajr', label: 'பஜ்ர்' },
  { id: 'dhuhr', label: 'ழுஹர்' },
  { id: 'asr', label: 'அஸர்' },
  { id: 'maghrib', label: 'மஃரிப்' },
  { id: 'isha', label: 'இஷா' },
]

const WEEKDAYS_TA = ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி']
const MONTHS_TA = ['ஜன', 'பிப்', 'மார்', 'ஏப்', 'மே', 'ஜூன்', 'ஜூலை', 'ஆக', 'செப்', 'அக்', 'நவ', 'டிச']

// இன்றைய தேதியிலிருந்து பின்னோக்கி WINDOW_SIZE நாட்களை (இன்று உட்பட) உருவாக்கும்
function generateRollingWindow(todayStr) {
  const dates = []
  const today = new Date(todayStr + 'T00:00:00')
  for (let i = WINDOW_SIZE - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const y = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    dates.push(`${y}-${mm}-${dd}`)
  }
  return dates
}

function formatDay(dateStr) {
  const dateObj = new Date(dateStr + 'T00:00:00')
  return {
    weekday: WEEKDAYS_TA[dateObj.getDay()],
    display: `${dateObj.getDate()} ${MONTHS_TA[dateObj.getMonth()]}`,
  }
}

function formatFullDate(dateStr) {
  const dateObj = new Date(dateStr + 'T00:00:00')
  return `${String(dateObj.getDate()).padStart(2, '0')} ${MONTHS_TA[dateObj.getMonth()]} ${dateObj.getFullYear()}`
}

function emptyPrayerState() {
  return {
    fajr: false,
    dhuhr: false,
    asr: false,
    maghrib: false,
    isha: false,
  }
}

// localStorage-ல் இருந்து தரவை படித்து, தற்போதைய 48-நாள் சாளரத்திற்கு
// உட்பட்ட தேதிகளை மட்டும் வைத்துக்கொண்டு (48 நாட்களுக்கு மேல் பழையவை auto-delete)
function loadWindowData(days) {
  let saved = {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) saved = JSON.parse(raw)
  } catch (e) {
    saved = {}
  }
  const data = {}
  days.forEach((day) => {
    data[day] = saved[day] || emptyPrayerState()
  })
  return data
}

export default function App() {
  const [today, setToday] = useState(getTodayStr)
  const days = useMemo(() => generateRollingWindow(today), [today])
  const [data, setData] = useState(() => loadWindowData(days))

  // ஒவ்வொரு தொழுகையும் complete ஆகும்போது காட்டப்படும் motivation toast
  const [toast, setToast] = useState(null) // { id, key }
  const toastTimerRef = useRef(null)
  const toastIdRef = useRef(0)

  const showMotivationToast = () => {
    toastIdRef.current += 1
    setToast({ id: toastIdRef.current })
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => {
      setToast(null)
    }, 2400)
  }

  // ஒரு நாளின் 5 தொழுகையும் நிறைவு ஆகும்போது காட்டப்படும் confetti celebration
  const [celebration, setCelebration] = useState(null) // { id }
  const celebrationTimerRef = useRef(null)
  const celebrationIdRef = useRef(0)

  const confettiPieces = useMemo(() => {
    if (!celebration) return []
    const colors = ['#C9A227', '#1B6B5A', '#E7CE7A', '#0F3D3E', '#FFFDF6']
    return Array.from({ length: 28 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.35,
      duration: 1.6 + Math.random() * 0.9,
      size: 6 + Math.random() * 6,
      color: colors[i % colors.length],
      rotate: Math.round(Math.random() * 360),
      drift: Math.round((Math.random() - 0.5) * 90),
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [celebration?.id])

  const showCelebration = () => {
    celebrationIdRef.current += 1
    setCelebration({ id: celebrationIdRef.current })
    if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current)
    celebrationTimerRef.current = setTimeout(() => {
      setCelebration(null)
    }, 2200)
  }

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
      if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current)
    }
  }, [])

  // தேதி மாறும் போதெல்லாம் (நள்ளிரவைக் கடந்தால், அல்லது tab மீண்டும் திறக்கும் போது)
  // சாளரத்தை மீண்டும் கணக்கிட்டு, 48 நாட்களுக்கு மேல் உள்ள பழைய தரவை நீக்கும்
  useEffect(() => {
    const checkDate = () => {
      const current = getTodayStr()
      setToday((prev) => (prev !== current ? current : prev))
    }
    const intervalId = setInterval(checkDate, 60 * 1000)
    document.addEventListener('visibilitychange', checkDate)
    window.addEventListener('focus', checkDate)
    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', checkDate)
      window.removeEventListener('focus', checkDate)
    }
  }, [])

  // சாளரம் மாறும் போது (இன்று புதுப்பிக்கப்படும் போது) தரவை புதிய சாளரத்திற்கு
  // ஏற்றவாறு மீண்டும் கட்டமைக்கும் — பழைய தேதிகள் தானாக நீக்கப்படும்,
  // புதிய தேதி தானாக சேர்க்கப்படும்
  useEffect(() => {
    setData((prev) => {
      const next = {}
      days.forEach((day) => {
        next[day] = prev[day] || emptyPrayerState()
      })
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (e) {
      // localStorage unavailable — ignore silently
    }
  }, [data])

  const togglePrayer = (day, prayerId) => {
    setData((prev) => {
      const wasOn = prev[day][prayerId]
      const nextDayState = { ...prev[day], [prayerId]: !wasOn }
      // ஆஃப்-லிருந்து ஆன் ஆகும்போது மட்டும் (complete ஆகும்போது) animation காட்டப்படும்
      if (!wasOn) {
        const nowFullyComplete = PRAYERS.every((p) => nextDayState[p.id])
        if (nowFullyComplete) {
          showCelebration()
        } else {
          showMotivationToast()
        }
      }
      return {
        ...prev,
        [day]: nextDayState,
      }
    })
  }

  const resetAll = () => {
    if (window.confirm('எல்லா பதிவுகளையும் அழிக்கவா? இதை மீட்டெடுக்க முடியாது.')) {
      const cleared = {}
      days.forEach((day) => {
        cleared[day] = emptyPrayerState()
      })
      setData(cleared)
    }
  }

  const totalPrayers = days.length * PRAYERS.length
  const completedPrayers = days.reduce(
    (sum, day) => sum + PRAYERS.filter((p) => data[day][p.id]).length,
    0
  )
  const percentage = totalPrayers
    ? Math.round((completedPrayers / totalPrayers) * 100)
    : 0

  const fullyCompletedDays = days.filter(
    (day) => PRAYERS.every((p) => data[day][p.id])
  ).length

  let currentStreak = 0
  for (let i = days.length - 1; i >= 0; i--) {
    const day = days[i]
    const allDone = PRAYERS.every((p) => data[day][p.id])
    if (allDone) currentStreak++
    else break
  }

  // streak அதிகரிக்கும் போது stat card-ல் சிறு bump animation
  const [streakBump, setStreakBump] = useState(false)
  const prevStreakRef = useRef(currentStreak)
  useEffect(() => {
    if (currentStreak > prevStreakRef.current) {
      setStreakBump(true)
      const t = setTimeout(() => setStreakBump(false), 650)
      prevStreakRef.current = currentStreak
      return () => clearTimeout(t)
    }
    prevStreakRef.current = currentStreak
  }, [currentStreak])

  return (
    <div>
      <style>{`
        @keyframes pt-toast-in {
          0% { opacity: 0; transform: translateY(14px) scale(0.92); }
          60% { opacity: 1; transform: translateY(-4px) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pt-toast-out {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-10px) scale(0.96); }
        }
        @keyframes pt-toast-glow {
          0%, 100% { box-shadow: 0 4px 18px rgba(201, 162, 39, 0.35); }
          50% { box-shadow: 0 4px 26px rgba(201, 162, 39, 0.6); }
        }
        @keyframes pt-star-pop {
          0% { opacity: 0; transform: scale(0) rotate(0deg); }
          40% { opacity: 1; transform: scale(1.3) rotate(80deg); }
          100% { opacity: 0.9; transform: scale(1) rotate(160deg); }
        }
        .pt-toast-wrap {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 32px;
          z-index: 9999;
          display: flex;
          justify-content: center;
          padding: 0 16px;
          box-sizing: border-box;
          pointer-events: none;
        }
        .pt-toast {
          display: flex;
          align-items: center;
          gap: 10px;
          background: linear-gradient(135deg, #0F3D3E, #145654);
          color: #F6EFD8;
          padding: 12px 20px;
          border-radius: 999px;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.2px;
          white-space: normal;
          text-align: center;
          max-width: 100%;
          box-sizing: border-box;
          border: 1px solid rgba(201, 162, 39, 0.55);
          animation:
            pt-toast-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards,
            pt-toast-glow 1.4s ease-in-out 0.45s infinite,
            pt-toast-out 0.35s ease-in forwards 2.05s;
        }
        @media (max-width: 420px) {
          .pt-toast {
            font-size: 13px;
            padding: 10px 16px;
            border-radius: 18px;
          }
        }
        .pt-toast-star {
          font-size: 16px;
          flex-shrink: 0;
          animation: pt-star-pop 0.6s ease-out;
        }
        .pt-prayer-btn {
          transition: transform 0.18s ease, background-color 0.18s ease, border-color 0.18s ease;
        }
        .pt-prayer-btn.on {
          animation: pt-toast-glow 1.2s ease-in-out 1;
        }
        .pt-prayer-btn:active {
          transform: scale(0.94);
        }

        /* ---- இன்றைய நாள் முழுமையாக நிறைவு: confetti + celebration banner ---- */
        @keyframes pt-confetti-fall {
          0% { transform: translate(0, -30px) rotate(0deg); opacity: 0; }
          12% { opacity: 1; }
          100% { transform: translate(var(--pt-drift), 62vh) rotate(calc(var(--pt-rotate) + 360deg)); opacity: 0; }
        }
        .pt-confetti-wrap {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 9998;
          overflow: hidden;
        }
        .pt-confetti-piece {
          position: absolute;
          top: 18%;
          border-radius: 2px;
          transform: rotate(var(--pt-rotate));
          animation-name: pt-confetti-fall;
          animation-timing-function: ease-in;
          animation-fill-mode: forwards;
        }
        @keyframes pt-celebration-in {
          0% { opacity: 0; transform: translate(-50%, -12px) scale(0.85); }
          55% { opacity: 1; transform: translate(-50%, 3px) scale(1.04); }
          100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }
        @keyframes pt-celebration-out {
          0% { opacity: 1; transform: translate(-50%, 0) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -10px) scale(0.94); }
        }
        .pt-celebration-wrap {
          position: fixed;
          left: 50%;
          top: 18px;
          z-index: 9999;
          pointer-events: none;
          width: calc(100% - 32px);
          max-width: 460px;
          display: flex;
          justify-content: center;
        }
        .pt-celebration {
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #C9A227, #E7CE7A);
          color: #0F3D3E;
          padding: 12px 18px;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 700;
          text-align: center;
          box-shadow: 0 8px 24px rgba(201, 162, 39, 0.45);
          border: 1px solid rgba(15, 61, 62, 0.15);
          animation:
            pt-celebration-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards,
            pt-celebration-out 0.4s ease-in forwards 1.8s;
        }
        .pt-celebration-star {
          animation: pt-star-pop 0.7s ease-out;
        }
        @media (max-width: 420px) {
          .pt-celebration { font-size: 12.5px; padding: 10px 14px; }
        }

        /* ---- prayer dot: check ஆகும்போது ping ring ---- */
        .pt-prayer-dot {
          position: relative;
        }
        @keyframes pt-ring-ping {
          0% { transform: scale(0.6); opacity: 0.7; }
          100% { transform: scale(2.1); opacity: 0; }
        }
        .pt-prayer-btn.on .pt-prayer-dot::after {
          content: '';
          position: absolute;
          inset: -5px;
          border-radius: 50%;
          border: 2px solid var(--done, #1B6B5A);
          animation: pt-ring-ping 0.6s ease-out;
        }

        /* ---- progress bar shimmer ---- */
        .pt-progress-fill {
          position: relative;
          overflow: hidden;
        }
        @keyframes pt-shimmer {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(220%); }
        }
        .pt-progress-fill::after {
          content: '';
          position: absolute;
          top: 0; left: 0; height: 100%; width: 40%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.65), transparent);
          animation: pt-shimmer 2.2s ease-in-out infinite;
        }

        /* ---- streak stat card bump ---- */
        @keyframes pt-bump {
          0% { transform: scale(1); }
          40% { transform: scale(1.1); box-shadow: 0 0 0 4px rgba(201, 162, 39, 0.35); }
          100% { transform: scale(1); box-shadow: none; }
        }
        .pt-stat-card.pt-bump {
          animation: pt-bump 0.6s ease-out;
          border-color: var(--gold, #C9A227);
        }
        @keyframes pt-flame-flicker {
          0%, 100% { transform: scale(1) rotate(-2deg); opacity: 1; }
          50% { transform: scale(1.12) rotate(3deg); opacity: 0.85; }
        }
        .pt-flame {
          display: inline-block;
          font-size: 15px;
          margin-left: 3px;
          animation: pt-flame-flicker 1.1s ease-in-out infinite;
        }
      `}</style>

      <header className="pt-header">
        <svg className="pt-crescent" viewBox="0 0 48 48" fill="none">
          <path
            d="M30 6C20 8 13 17 13 27c0 11 9 20 20 20 3 0 6-0.6 8.6-1.8C36 47 29 48 24 48 10.7 48 0 37.3 0 24S10.7 0 24 0c5 0 9.7 1.5 13.6 4.1C34.5 5 32.3 5.4 30 6z"
            fill="#0F3D3E"
            transform="translate(4,0) scale(0.92)"
          />
          <circle cx="38" cy="10" r="2.6" fill="#C9A227" />
        </svg>
        <h1 className="pt-title">தொழுகை பதிவேடு</h1>
        <p className="pt-subtitle">
          {formatFullDate(days[0])} &ndash; {formatFullDate(days[days.length - 1])} &middot; {WINDOW_SIZE} நாட்கள் &middot; தினமும் 5 வேளை தொழுகை
        </p>
      </header>

      <svg className="pt-divider" viewBox="0 0 600 14" preserveAspectRatio="none">
        <line x1="0" y1="7" x2="600" y2="7" stroke="#DFD5B8" strokeWidth="1" />
        <circle cx="300" cy="7" r="4" fill="#C9A227" />
        <circle cx="270" cy="7" r="2" fill="#C9A227" opacity="0.6" />
        <circle cx="330" cy="7" r="2" fill="#C9A227" opacity="0.6" />
      </svg>

      <section className="pt-stats">
        <div className="pt-stat-card">
          <span className="pt-stat-value">{days.length}</span>
          <span className="pt-stat-label">மொத்த நாட்கள்</span>
        </div>
        <div className="pt-stat-card">
          <span className="pt-stat-value">{completedPrayers}/{totalPrayers}</span>
          <span className="pt-stat-label">தொழுகைகள்</span>
        </div>
        <div className="pt-stat-card">
          <span className="pt-stat-value">{fullyCompletedDays}</span>
          <span className="pt-stat-label">முழு நாட்கள்</span>
        </div>
        <div className={`pt-stat-card${streakBump ? ' pt-bump' : ''}`}>
          <span className="pt-stat-value">
            {currentStreak}
            {currentStreak > 0 && <span className="pt-flame">🔥</span>}
          </span>
          <span className="pt-stat-label">தொடர் நாட்கள்</span>
        </div>
      </section>

      <div className="pt-progress-track">
        <div className="pt-progress-fill" style={{ width: `${percentage}%` }} />
      </div>

      <main>
        {[...days].reverse().map((day) => {
          const { weekday, display } = formatDay(day)
          const doneCount = PRAYERS.filter((p) => data[day][p.id]).length
          const isComplete = doneCount === PRAYERS.length
          const isToday = day === today
          return (
            <div
              key={day}
              className={`pt-day-card${isComplete ? ' pt-complete' : ''}${isToday ? ' pt-today' : ''}`}
            >
              <div className="pt-day-head">
                <div>
                  <span className="pt-day-date">{display}</span>{' '}
                  <span className="pt-day-name">({weekday}){isToday ? ' · இன்று' : ''}</span>
                </div>
                <span className="pt-day-count">{doneCount}/5</span>
              </div>
              <div className="pt-prayer-row">
                {PRAYERS.map((prayer) => {
                  const isOn = data[day][prayer.id]
                  return (
                    <button
                      key={prayer.id}
                      type="button"
                      className={`pt-prayer-btn${isOn ? ' on' : ''}`}
                      onClick={() => togglePrayer(day, prayer.id)}
                      aria-pressed={isOn}
                    >
                      <span className="pt-prayer-dot">{isOn ? '✓' : ''}</span>
                      <span className="pt-prayer-label">{prayer.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </main>

      <div className="pt-footer">
        <button className="pt-reset" onClick={resetAll} type="button">
          எல்லாவற்றையும் அழி
        </button>
        <p className="pt-note">
          உங்கள் பதிவுகள் இந்த browser-ல் தானாக சேமிக்கப்படும்.
        </p>
      </div>

      {toast && (
        <div className="pt-toast-wrap" key={toast.id}>
          <div className="pt-toast">
            <span className="pt-toast-star">✦</span>
            <span>{MOTIVATION_MESSAGE}</span>
          </div>
        </div>
      )}

      {celebration && (
        <div key={celebration.id}>
          <div className="pt-confetti-wrap">
            {confettiPieces.map((c) => (
              <span
                key={c.id}
                className="pt-confetti-piece"
                style={{
                  left: `${c.left}%`,
                  width: `${c.size}px`,
                  height: `${c.size * 0.4}px`,
                  background: c.color,
                  animationDelay: `${c.delay}s`,
                  animationDuration: `${c.duration}s`,
                  '--pt-drift': `${c.drift}px`,
                  '--pt-rotate': `${c.rotate}deg`,
                }}
              />
            ))}
          </div>
          <div className="pt-celebration-wrap">
            <div className="pt-celebration">
              <span className="pt-celebration-star">✨</span>
              <span>மாஷா அல்லாஹ்! இன்றைய 5 தொழுகையும் நிறைவு</span>
              <span className="pt-celebration-star">✨</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}