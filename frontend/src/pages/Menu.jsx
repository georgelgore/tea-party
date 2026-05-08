import { useEffect, useState } from 'react'
import { getTeas } from '../api'

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

export default function Menu() {
  const [teas, setTeas] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedTea, setExpandedTea] = useState(null)

  useEffect(() => {
    getTeas().then(data => { setTeas(data); setLoading(false) })
  }, [])

  const groups = groupByCategory(teas)
  const inStock = teas.filter(t => Number(t.quantity_remaining_g) > 0)

  function toggleTea(name) {
    setExpandedTea(prev => prev === name ? null : name)
  }

  return (
    <div className="page">
      <div className="card menu-card">
        <div className="menu-header">
          <div className="menu-title">Doug &amp; George's Tea Menu</div>
          {!loading && (
            <div className="menu-subtitle">{inStock.length} teas available</div>
          )}
        </div>

        {loading ? (
          <p className="hint" style={{ marginTop: '1rem', textAlign: 'center' }}>Steeping…</p>
        ) : (
          CATEGORY_ORDER.map(cat => {
            const rows = groups[cat]
            if (!rows.length) return null
            return (
              <div key={cat} className="menu-section">
                <div className="menu-cat">
                  <span className="menu-cat-dot" style={{ background: CAT_COLORS[cat] }} />
                  <span className="menu-cat-label">{cat}</span>
                </div>
                {rows.map(tea => {
                  const oos = Number(tea.quantity_remaining_g) === 0
                  return (
                    <div key={tea.name} className={`menu-item${oos ? ' menu-oos' : ''}`}>
                      <div
                        className={`menu-row${tea.description ? ' menu-row-expandable' : ''}`}
                        onClick={() => tea.description && toggleTea(tea.name)}
                      >
                        <div className="menu-tea-info">
                          <span className="menu-tea-name">{tea.name}</span>
                          {tea.year && <span className="menu-tag">{tea.year}</span>}
                          {tea.subcategory && <span className="menu-tag">{tea.subcategory}</span>}
                        </div>
                        <div className="menu-row-right">
                          <span className="menu-vendor">{tea.vendor}</span>
                          {tea.description && (
                            <span className={`menu-chevron${expandedTea === tea.name ? ' menu-chevron-open' : ''}`}>›</span>
                          )}
                        </div>
                      </div>
                      {expandedTea === tea.name && tea.description && (
                        <p className="menu-description">{tea.description}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })
        )}

        <div className="menu-footer">
          brewed with love ☕
        </div>
      </div>
    </div>
  )
}
