import { useEffect, useState } from 'react'
import { getTeas, patchTea } from '../api'

const CATEGORY_ORDER = ['White', 'Green', 'Yellow', 'Oolong', 'Black', 'Ripe Puerh', 'Raw Puerh']

function groupByCategory(teas) {
  const groups = {}
  for (const cat of CATEGORY_ORDER) groups[cat] = []
  for (const tea of teas) {
    if (groups[tea.category]) groups[tea.category].push(tea)
  }
  return groups
}

function TeaRow({ tea, onSaved }) {
  const [value, setValue] = useState(tea.quantity_remaining_g ?? '')
  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState(null)
  const dirty = String(value) !== String(tea.quantity_remaining_g ?? '')
  const isEmpty = Number(tea.quantity_remaining_g) === 0

  async function save(qty) {
    setBusy(true)
    setFlash(null)
    try {
      await patchTea({ name: tea.name, quantity_remaining_g: qty ?? value })
      setFlash('ok')
      onSaved(tea.name, qty ?? value)
      setTimeout(() => setFlash(null), 2000)
    } catch (err) {
      setFlash('err')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`inv-row${isEmpty ? ' inv-empty' : ''}`}>
      <div className="inv-name">
        <span>{tea.name}</span>
        <span className="inv-vendor">{tea.vendor}</span>
      </div>
      <div className="inv-controls">
        <div className="inv-qty-wrap">
          <input
            type="number"
            min="0"
            step="0.1"
            value={value}
            onChange={e => setValue(e.target.value)}
            className="inv-qty"
            aria-label={`Remaining grams for ${tea.name}`}
          />
          <span className="inv-unit">/ {tea.quantity_g}g</span>
        </div>
        <button
          className="inv-btn inv-btn-empty"
          onClick={() => { setValue(0); save(0) }}
          disabled={busy || isEmpty}
          title="Mark as empty"
        >
          Empty
        </button>
        <button
          className="inv-btn inv-btn-save"
          onClick={() => save()}
          disabled={busy || !dirty}
        >
          {busy ? '…' : 'Save'}
        </button>
        {flash === 'ok' && <span className="inv-tick">✓</span>}
        {flash === 'err' && <span className="inv-cross">✗</span>}
      </div>
    </div>
  )
}

export default function Inventory() {
  const [teas, setTeas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTeas().then(data => { setTeas(data); setLoading(false) })
  }, [])

  function handleSaved(name, newQty) {
    setTeas(ts => ts.map(t => t.name === name ? { ...t, quantity_remaining_g: newQty } : t))
  }

  const groups = groupByCategory(teas)
  const totalRemaining = teas.reduce((s, t) => s + Number(t.quantity_remaining_g || 0), 0)

  return (
    <div className="page">
      <div className="card inv-card">
        <div className="inv-header">
          <div className="card-title" style={{ margin: 0 }}>Inventory</div>
          {!loading && (
            <span className="inv-summary">
              {teas.length} teas · {totalRemaining.toFixed(0)}g remaining
            </span>
          )}
        </div>

        {loading ? (
          <p className="hint" style={{ marginTop: '1rem' }}>Loading…</p>
        ) : (
          CATEGORY_ORDER.map(cat => {
            const rows = groups[cat]
            if (!rows.length) return null
            return (
              <div key={cat} className="inv-section">
                <div className="inv-cat">{cat}</div>
                {rows.map(tea => (
                  <TeaRow key={tea.name} tea={tea} onSaved={handleSaved} />
                ))}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
