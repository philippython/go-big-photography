import { useState, useEffect } from 'react'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isSameDay,
  isToday, isBefore, parseISO, startOfDay,
} from 'date-fns'
import './DatePicker.css'

export default function DatePicker({ value, onChange, bookedDates = [], minDaysAhead = 2 }) {
  const today      = startOfDay(new Date())
  const minDate    = startOfDay(addDays(today, minDaysAhead))
  const bookedSet  = new Set(bookedDates)
  const parsedVal  = value ? parseISO(value) : null

  const [viewMonth, setViewMonth] = useState(
    () => startOfMonth(value ? parseISO(value) : addDays(today, minDaysAhead))
  )
  const [open, setOpen] = useState(false)

  function isDisabled(date) {
    const d = startOfDay(date)
    if (isBefore(d, minDate)) return true
    if (bookedSet.has(format(date, 'yyyy-MM-dd'))) return true
    return false
  }

  function selectDate(date) {
    if (isDisabled(date)) return
    onChange(format(date, 'yyyy-MM-dd'))
    setOpen(false)
  }

  function buildDays() {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 })
    const end   = endOfWeek(endOfMonth(viewMonth),   { weekStartsOn: 1 })
    const days  = []
    let cur     = start
    while (!isBefore(end, cur)) {
      days.push(cur)
      cur = addDays(cur, 1)
    }
    return days
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (!e.target.closest('.dp-wrap')) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const days     = buildDays()
  const DAY_HDRS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const canPrev  = !isBefore(
    startOfMonth(subMonths(viewMonth, 1)),
    startOfMonth(minDate)
  )

  return (
    <div className="dp-wrap">
      {/* Trigger */}
      <button
        type="button"
        className={`dp-trigger${open ? ' open' : ''}${value ? ' has-value' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className="dp-trigger__icon">📅</span>
        <span className="dp-trigger__text">
          {parsedVal
            ? format(parsedVal, 'EEEE, d MMMM yyyy')
            : 'Choose your session date'}
        </span>
        <span className="dp-trigger__chevron">{open ? '▲' : '▼'}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="dp-calendar">
          {/* Month nav */}
          <div className="dp-header">
            <button
              type="button"
              className="dp-nav"
              onClick={() => setViewMonth(m => subMonths(m, 1))}
              disabled={!canPrev}
            >
              ‹
            </button>
            <strong>{format(viewMonth, 'MMMM yyyy')}</strong>
            <button
              type="button"
              className="dp-nav"
              onClick={() => setViewMonth(m => addMonths(m, 1))}
            >
              ›
            </button>
          </div>

          {/* Legend */}
          <div className="dp-legend">
            <span><span className="dp-dot dp-dot--available" />Available</span>
            <span><span className="dp-dot dp-dot--booked"    />Booked</span>
            <span><span className="dp-dot dp-dot--past"      />Unavailable</span>
          </div>

          {/* Day headers */}
          <div className="dp-grid">
            {DAY_HDRS.map(d => (
              <div key={d} className="dp-day-name">{d}</div>
            ))}

            {/* Day cells */}
            {days.map((day, i) => {
              const key        = format(day, 'yyyy-MM-dd')
              const disabled   = isDisabled(day)
              const booked     = bookedSet.has(key)
              const past       = isBefore(startOfDay(day), minDate)
              const selected   = parsedVal && isSameDay(day, parsedVal)
              const otherMonth = !isSameMonth(day, viewMonth)
              const todayDay   = isToday(day)

              const cls = [
                'dp-day',
                disabled   ? 'dp-day--disabled'   : 'dp-day--available',
                booked     ? 'dp-day--booked'     : '',
                past       ? 'dp-day--past'       : '',
                selected   ? 'dp-day--selected'   : '',
                otherMonth ? 'dp-day--other-month': '',
                todayDay   ? 'dp-day--today'      : '',
              ].filter(Boolean).join(' ')

              return (
                <button
                  key={i}
                  type="button"
                  className={cls}
                  onClick={() => selectDate(day)}
                  disabled={disabled}
                  title={
                    booked ? 'Already booked'
                    : past ? 'Date unavailable'
                    : format(day, 'd MMMM yyyy')
                  }
                >
                  {format(day, 'd')}
                  {booked && !past && <span className="dp-day__dot" />}
                </button>
              )
            })}
          </div>

          <p className="dp-hint">
            Min. {minDaysAhead} days notice ·{' '}
            <span className="dp-hint--orange">
              {bookedDates.length} date{bookedDates.length !== 1 ? 's' : ''} already booked
            </span>
          </p>
        </div>
      )}
    </div>
  )
}