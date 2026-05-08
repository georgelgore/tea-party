import { useEffect, useRef, useState } from 'react'
import { getTeas, postBrew } from '../api'

const VESSELS = [
  { value: 'Hario ChaCha Kyusu Maru', label: 'Hario ChaCha Kyusu Maru (300ml western)' },
  { value: '100ml gaiwan', label: '100ml gaiwan (gong fu)' },
  { value: 'Grandpa style', label: 'Grandpa style' },
]

const RATINGS = [
  { value: 'thumbs_down', label: '👎' },
  { value: 'neutral',     label: '😐' },
  { value: 'thumbs_up',   label: '👍' },
]

const CATEGORY_ORDER = ['White', 'Green', 'Yellow', 'Oolong', 'Black', 'Ripe Puerh', 'Raw Puerh']

const CAT_COLORS = {
  'White':      '#a8a8a0',
  'Green':      '#5a7a4a',
  'Yellow':     '#b8963a',
  'Oolong':     '#8b6914',
  'Black':      '#3a2a1a',
  'Ripe Puerh': '#6b3a2a',
  'Raw Puerh':  '#4a6b3a',
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function TeaPicker({ teas, value, onChange }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const containerRef = useRef(null)

  const q = query.toLowerCase()
  const filtered = q
    ? teas.filter(t =>
        t.name.toLowerCase().includes(q) ||
        (t.vendor && t.vendor.toLowerCase().includes(q))
      )
    : teas

  const flatList = CATEGORY_ORDER.flatMap(cat => filtered.filter(t => t.category === cat))
  const flatIndexMap = new Map(flatList.map((t, i) => [t.name, i]))

  useEffect(() => {
    function onMouseDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  function select(name) {
    onChange(name)
    setOpen(false)
    setQuery('')
  }

  function handleKey(e) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') { setOpen(true); setQuery(''); setHighlighted(0) }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted(h => Math.min(h + 1, flatList.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted(h => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (flatList[highlighted]) select(flatList[highlighted].name)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="tea-picker" ref={containerRef}>
      <input
        className="tea-picker-input"
        placeholder="Search teas…"
        value={open ? query : value}
        onFocus={() => { setOpen(true); setQuery(''); setHighlighted(0) }}
        onChange={e => { setQuery(e.target.value); setHighlighted(0) }}
        onKeyDown={handleKey}
        autoComplete="off"
      />
      <span className="tea-picker-chevron">›</span>
      {open && (
        <div className="tea-picker-dropdown">
          {CATEGORY_ORDER.map(cat => {
            const opts = filtered.filter(t => t.category === cat)
            if (!opts.length) return null
            return (
              <div key={cat}>
                <div className="tea-picker-group">
                  <span className="tea-picker-dot" style={{ background: CAT_COLORS[cat] }} />
                  {cat}
                </div>
                {opts.map(tea => (
                  <div
                    key={tea.name}
                    className={`tea-picker-option${flatIndexMap.get(tea.name) === highlighted ? ' tea-picker-option-active' : ''}`}
                    onMouseDown={() => select(tea.name)}
                    onMouseEnter={() => setHighlighted(flatIndexMap.get(tea.name) ?? 0)}
                  >
                    {tea.name}
                  </div>
                ))}
              </div>
            )
          })}
          {!flatList.length && <div className="tea-picker-empty">No teas found</div>}
        </div>
      )}
    </div>
  )
}

export default function Brew() {
  const [teas, setTeas] = useState([])
  const [form, setForm] = useState({ tea_name: '', vessel: VESSELS[0].value, leaf_g: '', water_ml: '', temp_c: '', steep_time_seconds: '', steeps: '1', date: today(), rating: '', tasting_notes: '' })
  const [flash, setFlash] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getTeas().then(rows => setTeas(rows))
  }, [])

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setFlash(null)
    try {
      await postBrew(form)
      setFlash({ ok: true, msg: `Logged: ${form.tea_name} on ${form.date}` })
      setForm(f => ({ ...f, tea_name: '', rating: '', tasting_notes: '', steeps: '1', leaf_g: '', water_ml: '', temp_c: '', steep_time_seconds: '' }))
    } catch (err) {
      setFlash({ ok: false, msg: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <div className="card">
        <div className="card-title">Log a brew session</div>

        {flash && <div className={`flash ${flash.ok ? 'flash-ok' : 'flash-err'}`}>{flash.msg}</div>}

        <form onSubmit={submit}>
          <div className="grid">

            <div className="full">
              <label>Tea</label>
              <TeaPicker teas={teas} value={form.tea_name} onChange={name => setForm(f => ({ ...f, tea_name: name }))} />
            </div>

            <div className="full">
              <label htmlFor="vessel">Vessel</label>
              <select id="vessel" value={form.vessel} onChange={set('vessel')}>
                {VESSELS.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="leaf_g">Leaf (g)</label>
              <input id="leaf_g" type="number" step="0.1" min="0" value={form.leaf_g} onChange={set('leaf_g')} required />
            </div>

            <div>
              <label htmlFor="water_ml">Water (ml)</label>
              <input id="water_ml" type="number" step="1" min="0" value={form.water_ml} onChange={set('water_ml')} required />
            </div>

            <div>
              <label htmlFor="temp_c">Temp (°C)</label>
              <input id="temp_c" type="number" step="1" min="0" max="100" value={form.temp_c} onChange={set('temp_c')} required />
            </div>

            <div>
              <label htmlFor="steep_time_seconds">Steep time (s)</label>
              <input id="steep_time_seconds" type="number" step="1" min="0" value={form.steep_time_seconds} onChange={set('steep_time_seconds')} required />
            </div>

            <div>
              <label htmlFor="steeps">Steeps</label>
              <input id="steeps" type="number" step="1" min="1" value={form.steeps} onChange={set('steeps')} required />
            </div>

            <div>
              <label htmlFor="date">Date</label>
              <input id="date" type="date" value={form.date} onChange={set('date')} required />
            </div>

            <div className="full">
              <label>Rating</label>
              <div className="brew-rating">
                {RATINGS.map(r => (
                  <label key={r.value} className={`brew-rating-btn${form.rating === r.value ? ' brew-rating-selected' : ''}`}>
                    <input type="radio" name="rating" value={r.value} checked={form.rating === r.value} onChange={set('rating')} />
                    {r.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="full">
              <label htmlFor="tasting_notes">Tasting notes</label>
              <textarea id="tasting_notes" value={form.tasting_notes} onChange={set('tasting_notes')} placeholder="What did you notice?" />
            </div>

          </div>

          <div className="submit-row">
            <button type="submit" disabled={busy || !form.tea_name}>{busy ? 'Logging…' : 'Log it →'}</button>
            <span className="hint">Saves to brew-log/brews.csv</span>
          </div>
        </form>
      </div>
    </div>
  )
}
