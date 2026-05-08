import { useEffect, useState } from 'react'
import { getTeas, postBrew } from '../api'

const VESSELS = [
  { value: 'Hario ChaCha Kyusu Maru', label: 'Hario ChaCha Kyusu Maru (300ml western)' },
  { value: '100ml gaiwan', label: '100ml gaiwan (gong fu)' },
  { value: 'Grandpa style', label: 'Grandpa style' },
]

const RATINGS = ['5','4.5','4','3.5','3','2.5','2','1.5','1']

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function Brew() {
  const [teas, setTeas] = useState([])
  const [form, setForm] = useState({ tea_name: '', vessel: VESSELS[0].value, leaf_g: '', water_ml: '', temp_c: '', steep_time_seconds: '', steeps: '1', date: today(), rating: '', tasting_notes: '' })
  const [flash, setFlash] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getTeas().then(rows => setTeas(rows.map(r => r.name)))
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
              <label htmlFor="tea_name">Tea</label>
              <select id="tea_name" value={form.tea_name} onChange={set('tea_name')} required>
                <option value="" disabled>Select a tea…</option>
                {teas.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
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
              <div className="stars">
                {RATINGS.map(r => (
                  <label key={r} title={r} style={{ cursor: 'pointer' }}>
                    <input type="radio" name="rating" value={r} checked={form.rating === r} onChange={set('rating')} />
                    ★
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
            <button type="submit" disabled={busy}>{busy ? 'Logging…' : 'Log it →'}</button>
            <span className="hint">Saves to brew-log/brews.csv</span>
          </div>
        </form>
      </div>
    </div>
  )
}
