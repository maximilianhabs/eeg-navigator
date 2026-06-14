'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  username: string
  role: 'user' | 'admin'
  createdAt: string
}

export default function UserManagementClient({ initialUsers }: { initialUsers: User[] }) {
  const router = useRouter()
  const [users, setUsers] = useState(initialUsers)
  const [form, setForm] = useState({ username: '', password: '', role: 'user' as 'user' | 'admin' })
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function addUser(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)
    setError('')
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setUsers(prev => [...prev, data.user])
      setForm({ username: '', password: '', role: 'user' })
      showToast(`✓ Benutzer „${data.user.username}" angelegt`)
    } catch {
      setError('Verbindungsfehler')
    } finally {
      setAdding(false)
    }
  }

  async function deleteUser(id: string, username: string) {
    if (!confirm(`Benutzer „${username}" wirklich löschen?`)) return
    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const data = await res.json()
    if (!res.ok) { alert(data.error); return }
    setUsers(prev => prev.filter(u => u.id !== id))
    showToast(`✓ Benutzer „${username}" gelöscht`)
    router.refresh()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">

      {toast && (
        <div className="fixed top-20 right-4 z-50 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg bg-green-600 text-white">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin"
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all hover:-translate-x-0.5"
          style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/>
          </svg>
          Admin
        </Link>
        <span style={{ color: 'var(--text-tertiary)' }} className="text-xs">/</span>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Benutzerverwaltung</h1>
      </div>

      {/* User list */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="px-4 py-3 border-b flex items-center justify-between"
          style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border)' }}>
          <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            Aktive Benutzer ({users.length})
          </span>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {users.map(u => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3"
              style={{ backgroundColor: 'var(--bg-surface)' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm"
                style={{
                  backgroundColor: u.role === 'admin' ? '#ede9fe' : '#dbeafe',
                  color: u.role === 'admin' ? '#6d28d9' : '#1d4ed8',
                }}>
                {u.username[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{u.username}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    u.role === 'admin' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {u.role}
                  </span>
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                  Erstellt: {u.createdAt} · ID: {u.id}
                </div>
              </div>
              {u.role !== 'admin' && (
                <button onClick={() => deleteUser(u.id, u.username)}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                  style={{ color: 'var(--text-tertiary)', borderColor: 'var(--border)' }}>
                  Löschen
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add user */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="px-4 py-3 border-b"
          style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border)' }}>
          <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>+ Neuen Benutzer anlegen</span>
        </div>
        <form onSubmit={addUser} className="px-4 py-4 space-y-4" style={{ backgroundColor: 'var(--bg-surface)' }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                style={{ color: 'var(--text-secondary)' }}>Benutzername</label>
              <input type="text" value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="max.mustermann"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}/>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                style={{ color: 'var(--text-secondary)' }}>Passwort</label>
              <input type="password" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Mindestens 8 Zeichen"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}/>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                style={{ color: 'var(--text-secondary)' }}>Rolle</label>
              <select value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value as 'user' | 'admin' }))}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                <option value="user">user — Nur Lesen</option>
                <option value="admin">admin — Voller Zugriff</option>
              </select>
            </div>
          </div>
          {error && (
            <p className="text-xs font-medium text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
          <button type="submit" disabled={adding || !form.username || !form.password}
            className="rounded-lg bg-slate-800 px-5 py-2 text-sm font-bold text-white hover:bg-slate-700 transition-colors disabled:opacity-40">
            {adding ? 'Anlegen…' : 'Anlegen'}
          </button>
        </form>
      </div>

    </div>
  )
}
