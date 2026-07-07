import { useState, useEffect, useMemo } from 'react'

const STORAGE_KEY = 'prayerTrackerData_rolling48'
const WINDOW_SIZE = 48 // மொத்தம் இத்தனை நாட்கள் தொடர்ந்து காட்டப்படும்

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
    setData((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [prayerId]: !prev[day][prayerId],
      },
    }))
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

  return (
    <div>
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
        <div className="pt-stat-card">
          <span className="pt-stat-value">{currentStreak}</span>
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
    </div>
  )
}
