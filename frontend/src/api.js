const BASE = import.meta.env.VITE_API_URL ?? ''

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error ?? res.statusText)
  return body
}

export const getTeas = () => req('/api/teas')
export const postBrew = (data) => req('/api/brew', { method: 'POST', body: JSON.stringify(data) })
export const postTea = (data) => req('/api/tea', { method: 'POST', body: JSON.stringify(data) })
export const patchTea = (data) => req('/api/tea', { method: 'PATCH', body: JSON.stringify(data) })
