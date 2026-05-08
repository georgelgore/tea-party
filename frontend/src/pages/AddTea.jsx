import { useState } from 'react'
import { postTea } from '../api'

const VENDORS = ['Yunnan Sourcing', 'white2tea']
const CATEGORIES = ['White', 'Green', 'Yellow', 'Oolong', 'Black', 'Ripe Puerh', 'Raw Puerh']

const EMPTY = { name: '', vendor: VENDORS[0], category: CATEGORIES[0], subcategory: '', year: '', quantity_g: '', notes: '' }

export default function AddTea() {
  const [form, setForm] = useState(EMPTY)
  const [flash, setFlash] = useState(null)
  const [busy, setBusy] = useState(false)

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setFlash(null)
    try {
      await postTea(form)
      setFlash({ ok: true, msg: `Added: ${form.name}` })
      setForm(EMPTY)
    } catch (err) {
      setFlash({ ok: false, msg: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <div className="card">
        <div className="card-title">Add a new tea</div>

        {flash && <div className={`flash ${flash.ok ? 'flash-ok' : 'flash-err'}`}>{flash.msg}</div>}

        <form onSubmit={submit}>
          <div className="grid">

            <div className="full">
              <label htmlFor="name">Name</label>
              <input id="name" type="text" value={form.name} onChange={set('name')} placeholder="e.g. 2026 Silver Needle" required />
            </div>

            <div>
              <label htmlFor="vendor">Vendor</label>
              <select id="vendor" value={form.vendor} onChange={set('vendor')}>
                {VENDORS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="category">Category</label>
              <select id="category" value={form.category} onChange={set('category')}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="subcategory">Subcategory <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
              <input id="subcategory" type="text" value={form.subcategory} onChange={set('subcategory')} placeholder="e.g. Dancong, Yancha" />
            </div>

            <div>
              <label htmlFor="year">Year <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
              <input id="year" type="number" min="1900" max="2100" value={form.year} onChange={set('year')} placeholder="2026" />
            </div>

            <div className="full">
              <label htmlFor="quantity_g">Starting quantity (g)</label>
              <input id="quantity_g" type="number" step="0.1" min="0" value={form.quantity_g} onChange={set('quantity_g')} required />
            </div>

            <div className="full">
              <label htmlFor="notes">Notes <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
              <textarea id="notes" value={form.notes} onChange={set('notes')} placeholder="Any notes about this tea" />
            </div>

          </div>

          <div className="submit-row">
            <button type="submit" disabled={busy}>{busy ? 'Adding…' : 'Add tea →'}</button>
            <span className="hint">Saves to inventory/teas.csv</span>
          </div>
        </form>
      </div>
    </div>
  )
}
