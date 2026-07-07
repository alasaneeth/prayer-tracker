import { useState, useEffect, useMemo } from 'react'

const STORAGE_KEY = 'prayerTrackerData_2026_07'
const START_DATE = '2026-07-04'
const END_DATE = '2026-08-20' // 04-07-2026 முதல் 48 நாட்கள்

const PRAYERS = [
  { id: 'fajr', label: 'பஜ்ர்' },
  { id: 'dhuhr', label: 'ழுஹர்' },
  { id: 'asr', label: 'அஸர்' },
  { id: 'maghrib', label: 'மஃரிப்' },
  { id: 'isha', label: 'இஷா' },
]

const WEEKDAYS_TA = ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி']
const MONTHS_TA = ['ஜன', 'பிப்', 'மார்', 'ஏப்', 'மே', 'ஜூன்', 'ஜூலை', 'ஆக', 'செப்', 'அக்', 'நவ', 'டிச']

function generateDateRange(start, end) {
  const dates = []
  let current = new Date(start + 'T00:00:00')
  const last = new Date(end + 'T00:00:00')
  while (current <= last) {
    const y = current.getFullYear()
    const m = String(current.getMonth() + 1).padStart(2, '0')
    const d = String(current.getDate()).padStart(2, '0')
    dates.push(`${y}-${m}-${d}`)
    current.setDate(current.getDate() + 1)
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

function loadInitialData(days) {
  let saved = {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) saved = JSON.parse(raw)
  } catch (e) {
    saved = {}
  }
  const data = {}
  days.forEach((day) => {
    data[day] = saved[day] || {
      fajr: false,
      dhuhr: false,
      asr: false,
      maghrib: false,
      isha: false,
    }
  })
  return data
}

export default function App() {
  const days = useMemo(() => generateDateRange(START_DATE, END_DATE), [])
  const [data, setData] = useState(() => loadInitialData(days))

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
        cleared[day] = {
          fajr: false,
          dhuhr: false,
          asr: false,
          maghrib: false,
          isha: false,
        }
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
        <p className="pt-subtitle">04 ஜூலை 2026 &ndash; 20 ஆகஸ்ட் 2026  &middot; 48 நாட்கள் &middot; தினமும் 5 வேளை தொழுகை</p>
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
        {days.map((day) => {
          const { weekday, display } = formatDay(day)
          const doneCount = PRAYERS.filter((p) => data[day][p.id]).length
          const isComplete = doneCount === PRAYERS.length
          return (
            <div
              key={day}
              className={`pt-day-card${isComplete ? ' pt-complete' : ''}`}
            >
              <div className="pt-day-head">
                <div>
                  <span className="pt-day-date">{display}</span>{' '}
                  <span className="pt-day-name">({weekday})</span>
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
