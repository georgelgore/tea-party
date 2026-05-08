import { useEffect, useState } from 'react'
import { getTeas, patchTea } from '../api'

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

function groupByCategory(teas) {
  const groups = {}
  for (const cat of CATEGORY_ORDER) groups[cat] = []
  for (const tea of teas) {
    if (groups[tea.category]) groups[tea.category].push(tea)
  }
  return groups
}

function TeaCard({ tea, onSaved }) {
  const [value, setValue] = useState(tea.quantity_remaining_g ?? '')
  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState(null)
  const dirty = String(value) !== String(tea.quantity_remaining_g ?? '')
  const isEmpty = Number(tea.quantity_remaining_g) === 0
  const pct = Number(tea.quantity_g) > 0
    ? Math.min(100, (Number(tea.quantity_remaining_g) / Number(tea.quantity_g)) * 100)
    : 0
  const color = CAT_COLORS[tea.category] || '#888'

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
    <div className={`inv-card-item${isEmpty ? ' inv-card-empty' : ''}`}>
      <div className="inv-card-vendor">
        <span className="inv-card-dot" style={{ background: color }} />
        {tea.vendor}
      </div>
      <div className="inv-card-name">{tea.name}</div>
      {(tea.year || tea.subcategory) && (
        <div className="inv-card-meta">
          {[tea.year, tea.subcategory].filter(Boolean).join(' · ')}
        </div>
      )}
      <div className="inv-card-bar-wrap">
        <div className="inv-card-bar">
          <div className="inv-card-bar-fill" style={{ width: `${pct}%`, background: color }} />
        </div>
        <span className="inv-card-qty">{tea.quantity_remaining_g}/{tea.quantity_g}g</span>
      </div>
      <div className="inv-card-controls">
        <input
          type="number"
          min="0"
          step="0.1"
          value={value}
          onChange={e => setValue(e.target.value)}
          className="inv-qty"
          aria-label={`Remaining grams for ${tea.name}`}
        />
        <button
          className="inv-btn inv-btn-empty"
          onClick={() => { setValue(0); save(0) }}
          disabled={busy || isEmpty}
          title="Mark as empty"
        >Empty</button>
        <button
          className="inv-btn inv-btn-save"
          onClick={() => save()}
          disabled={busy || !dirty}
        >{busy ? '…' : 'Save'}</button>
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
  const runningLow = teas
    .filter(t => {
      const rem = Number(t.quantity_remaining_g)
      const total = Number(t.quantity_g)
      return total > 0 && rem > 0 && rem / total < 0.2
    })
    .sort((a, b) => Number(a.quantity_remaining_g) - Number(b.quantity_remaining_g))

  return (
    <div className="inv-layout">
      <aside className="inv-sidebar">
        <div>
          <span className="inv-sidebar-num">{loading ? '—' : totalRemaining.toFixed(0)}</span>
          <span className="inv-sidebar-unit">g</span>
        </div>
        <div className="inv-sidebar-summary">
          {teas.length} teas · {CATEGORY_ORDER.length} categories
        </div>

        <div className="inv-sidebar-heading">The shelves</div>
        {CATEGORY_ORDER.map(cat => {
          const rows = groups[cat]
          if (!rows.length) return null
          return (
            <div key={cat} className="inv-sidebar-cat-row">
              <span className="inv-card-dot" style={{ background: CAT_COLORS[cat] }} />
              <span>{cat}</span>
              <span className="inv-sidebar-cat-count">{rows.length}</span>
            </div>
          )
        })}

        {runningLow.length > 0 && (
          <>
            <div className="inv-sidebar-heading">Running low</div>
            {runningLow.map(tea => (
              <div key={tea.name} className="inv-sidebar-low-item">
                <span className="inv-sidebar-low-name">{tea.name}</span>
                <span className="inv-sidebar-low-g">{tea.quantity_remaining_g}g</span>
              </div>
            ))}
          </>
        )}
      </aside>

      <main className="inv-main">
        {loading ? (
          <p className="hint" style={{ marginTop: '2rem' }}>Loading…</p>
        ) : (
          CATEGORY_ORDER.map(cat => {
            const rows = groups[cat]
            if (!rows.length) return null
            const catTotal = rows.reduce((s, t) => s + Number(t.quantity_remaining_g || 0), 0)
            return (
              <section key={cat} className="inv-grid-section">
                <div className="inv-section-header">
                  <span className="inv-section-dot" style={{ background: CAT_COLORS[cat] }} />
                  <h2 className="inv-section-name">{cat}</h2>
                  <span className="inv-section-meta">{rows.length} · {catTotal.toFixed(0)}g</span>
                </div>
                <div className="inv-grid">
                  {rows.map(tea => (
                    <TeaCard key={tea.name} tea={tea} onSaved={handleSaved} />
                  ))}
                </div>
              </section>
            )
          })
        )}
      </main>
    </div>
  )
}
