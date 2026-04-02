import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { supabase, CATEGORIES, STORAGE_BUCKET, BRAND } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'
import Logo from '../components/Logo'
import './Admin.css'

const TABS = [
  { id: 'upload',   label: 'Upload',   icon: '↑' },
  { id: 'catalogue',label: 'Catalogue',icon: '⊞' },
  { id: 'bookings', label: 'Bookings', icon: '📋' },
]

const STATUS_OPTS = ['new','contacted','confirmed','completed','declined']
const STATUS_COLORS = {
  new:       { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  contacted: { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa' },
  confirmed: { bg: 'rgba(22,163,74,0.12)',  color: '#4ade80' },
  completed: { bg: 'rgba(255,255,255,0.06)',color: '#888' },
  declined:  { bg: 'rgba(220,38,38,0.12)',  color: '#f87171' },
}

export default function Admin() {
  const { user, signOut } = useAuth()
  const navigate           = useNavigate()
  const [tab, setTab]      = useState('upload')

  // Upload state
  const [files, setFiles]           = useState([])
  const [upForm, setUpForm]         = useState({ title: '', category: '', description: '' })
  const [uploading, setUploading]   = useState(false)
  const [upProgress, setUpProgress] = useState([])
  const [upDone, setUpDone]         = useState(false)
  const [upError, setUpError]       = useState('')

  // Catalogue state
  const [photos, setPhotos]           = useState([])
  const [photoLoading, setPhotoLoading] = useState(false)
  const [catFilter, setCatFilter]     = useState('all')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]       = useState(false)

  // Bookings state
  const [bookings, setBookings]         = useState([])
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingSearch, setBookingSearch] = useState('')
  const [bookingStatus, setBookingStatus] = useState('all')
  const [expandedBooking, setExpandedBooking] = useState(null)

  useEffect(() => {
    if (tab === 'catalogue') fetchPhotos()
    if (tab === 'bookings')  fetchBookings()
  }, [tab, catFilter])

  /* ── Dropzone ── */
  const onDrop = useCallback(accepted => {
    const mapped = accepted.map(f => Object.assign(f, { preview: URL.createObjectURL(f) }))
    setFiles(p => [...p, ...mapped])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxSize: 20 * 1024 * 1024,
  })

  /* ── Upload ── */
  async function handleUpload() {
    if (!files.length)            { setUpError('Please add at least one photo.'); return }
    if (!upForm.title)            { setUpError('Please enter a title.'); return }
    if (!upForm.category)         { setUpError('Please select a category.'); return }
    setUpError(''); setUploading(true)
    setUpProgress(files.map(() => 0))

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const ext  = file.name.split('.').pop()
      const path = `${upForm.category}/${Date.now()}_${i}.${ext}`

      const { error: se } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file)
      if (se) { console.error(se); continue }

      const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
      const title = files.length === 1 ? upForm.title : `${upForm.title} ${i + 1}`

      await supabase.from('catalogue_items').insert([{
        title,
        category:     upForm.category,
        description:  upForm.description,
        image_url:    urlData.publicUrl,
        storage_path: path,
        created_at:   new Date().toISOString(),
        updated_at:   new Date().toISOString(),
      }])

      setUpProgress(p => p.map((v, idx) => idx === i ? 100 : v))
    }

    setUploading(false)
    setUpDone(true)
    setFiles([])
    setUpForm({ title: '', category: '', description: '' })
    setTimeout(() => setUpDone(false), 4000)
  }

  /* ── Catalogue ── */
  async function fetchPhotos() {
    setPhotoLoading(true)
    let q = supabase.from('catalogue_items').select('*').order('created_at', { ascending: false })
    if (catFilter !== 'all') q = q.eq('category', catFilter)
    const { data } = await q
    setPhotos(data || [])
    setPhotoLoading(false)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    await supabase.storage.from(STORAGE_BUCKET).remove([deleteTarget.storage_path])
    await supabase.from('catalogue_items').delete().eq('id', deleteTarget.id)
    setDeleteTarget(null)
    setDeleting(false)
    fetchPhotos()
  }

  /* ── Bookings ── */
  async function fetchBookings() {
    setBookingLoading(true)
    const { data } = await supabase.from('bookings').select('*').order('created_at', { ascending: false })
    setBookings(data || [])
    setBookingLoading(false)
  }

  async function updateStatus(id, status) {
    await supabase.from('bookings').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    setBookings(b => b.map(bk => bk.id === id ? { ...bk, status } : bk))
  }

  const filteredBookings = bookings.filter(b => {
    const matchStatus = bookingStatus === 'all' || (b.status || 'new') === bookingStatus
    const q = bookingSearch.toLowerCase()
    const matchSearch = !q || b.name?.toLowerCase().includes(q) || b.email?.toLowerCase().includes(q) || b.package_name?.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  async function handleSignOut() { await signOut(); navigate('/') }

  const allCats = [{ id: 'all', label: 'All' }, ...CATEGORIES]

  return (
    <div className="adm">
      {/* Sidebar */}
      <aside className="adm__sidebar">
        <div className="adm__sidebar-logo"><Logo size="sm" /></div>

        <nav className="adm__nav">
          {TABS.map(t => (
            <button key={t.id} className={`adm__nav-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
              <span className="adm__nav-icon">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>

        <div className="adm__user">
          <div className="adm__user-info">
            <div className="adm__avatar">{user?.email?.[0]?.toUpperCase()}</div>
            <div>
              <span>Admin</span>
              <small>{user?.email}</small>
            </div>
          </div>
          <button className="btn-outline adm__signout" onClick={handleSignOut}>Sign Out</button>
        </div>
      </aside>

      {/* Main */}
      <main className="adm__main">

        {/* ══ UPLOAD ══ */}
        {tab === 'upload' && (
          <div className="adm__section">
            <div className="adm__header">
              <h1>Upload Photos</h1>
              <p>Add new work to the public portfolio. JPG, PNG, WebP — max 20MB each.</p>
            </div>

            {upDone  && <div className="adm__banner success">✓ Photos uploaded — they're live in your portfolio!</div>}
            {upError && <div className="adm__banner error">{upError}</div>}

            <div className="up-layout">
              <div className="up-left">
                <div {...getRootProps()} className={`up-zone ${isDragActive ? 'drag' : ''}`}>
                  <input {...getInputProps()} />
                  <div className="up-zone__icon">↑</div>
                  <p>{isDragActive ? 'Drop it like it\'s 🔥' : 'Drag & drop photos here'}</p>
                  <span>or click to browse · max 20MB per file</span>
                </div>

                {files.length > 0 && (
                  <div className="up-previews">
                    <p className="up-previews__count">{files.length} file{files.length !== 1 ? 's' : ''} selected</p>
                    <div className="up-previews__grid">
                      {files.map((f, i) => (
                        <div key={i} className="up-preview">
                          <img src={f.preview} alt="" />
                          <button className="up-preview__rm" onClick={() => setFiles(fl => fl.filter((_,j) => j !== i))}>✕</button>
                          {uploading && (
                            <div className="up-preview__bar">
                              <div style={{ width: `${upProgress[i] || 0}%` }} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="up-right">
                <h3>Photo Details</h3>
                <p className="up-right__note">Applied to all photos in this batch.</p>

                <div className="up-form">
                  <div className="uf-group">
                    <label>Title *</label>
                    <input value={upForm.title} onChange={e => setUpForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Golden Hour Portraits" />
                  </div>
                  <div className="uf-group">
                    <label>Category *</label>
                    <select value={upForm.category} onChange={e => setUpForm(f => ({ ...f, category: e.target.value }))}>
                      <option value="">Select category…</option>
                      {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  <div className="uf-group">
                    <label>Description <span className="opt">(optional)</span></label>
                    <textarea rows={3} value={upForm.description}
                      onChange={e => setUpForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Brief description of the shoot or moment…" />
                  </div>
                  <button
                    className="btn-primary up-submit"
                    onClick={handleUpload}
                    disabled={uploading || !files.length}
                  >
                    {uploading ? 'Uploading…' : `Upload ${files.length > 0 ? files.length + ' ' : ''}Photo${files.length !== 1 ? 's' : ''} →`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ CATALOGUE ══ */}
        {tab === 'catalogue' && (
          <div className="adm__section">
            <div className="adm__header">
              <h1>Manage Catalogue</h1>
              <p>Browse, filter and remove photos from the public portfolio.</p>
            </div>

            <div className="adm__cat-filter">
              {allCats.map(c => (
                <button key={c.id} className={`cat-filter__btn ${catFilter === c.id ? 'active' : ''}`}
                  onClick={() => setCatFilter(c.id)}>{c.label}</button>
              ))}
            </div>

            {photoLoading ? (
              <div className="adm__photo-grid">
                {Array(8).fill(0).map((_,i) => <div key={i} className="skeleton adm__photo-skel" />)}
              </div>
            ) : photos.length === 0 ? (
              <div className="adm__empty"><span>◎</span><p>No photos in this category yet.</p></div>
            ) : (
              <div className="adm__photo-grid">
                {photos.map(p => (
                  <div key={p.id} className="adm__photo-card">
                    <div className="adm__photo-img">
                      <img src={p.image_url} alt={p.title} loading="lazy" />
                      <button className="adm__photo-del" onClick={() => setDeleteTarget(p)} title="Delete">🗑</button>
                    </div>
                    <div className="adm__photo-info">
                      <span className="adm__photo-cat">{CATEGORIES.find(c => c.id === p.category)?.label || p.category}</span>
                      <h4>{p.title}</h4>
                      <time>{format(new Date(p.created_at), 'd MMM yyyy · HH:mm')}</time>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Delete modal */}
            {deleteTarget && (
              <div className="adm__modal-overlay" onClick={() => setDeleteTarget(null)}>
                <div className="adm__modal" onClick={e => e.stopPropagation()}>
                  <h3>Delete Photo?</h3>
                  <p>This will permanently remove <strong>"{deleteTarget.title}"</strong> from the catalogue and storage. This cannot be undone.</p>
                  <div className="adm__modal-actions">
                    <button className="btn-outline" onClick={() => setDeleteTarget(null)}>Cancel</button>
                    <button className="adm__btn-danger" onClick={confirmDelete} disabled={deleting}>
                      {deleting ? 'Deleting…' : 'Delete Permanently'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ BOOKINGS ══ */}
        {tab === 'bookings' && (
          <div className="adm__section">
            <div className="adm__header">
              <h1>Booking Enquiries</h1>
              <p>All enquiries submitted via the booking form — newest first.</p>
            </div>

            {/* Search + filter */}
            <div className="adm__booking-toolbar">
              <input
                className="adm__search"
                placeholder="Search by name, email or package…"
                value={bookingSearch}
                onChange={e => setBookingSearch(e.target.value)}
              />
              <div className="adm__status-tabs">
                {['all', ...STATUS_OPTS].map(s => (
                  <button key={s} className={`adm__status-tab ${bookingStatus === s ? 'active' : ''}`}
                    onClick={() => setBookingStatus(s)}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="adm__bookings-summary">
              <div className="adm__summary-card">
                <strong>{bookings.length}</strong><span>Total</span>
              </div>
              {STATUS_OPTS.map(s => (
                <div key={s} className="adm__summary-card">
                  <strong style={{ color: STATUS_COLORS[s]?.color }}>{bookings.filter(b => (b.status || 'new') === s).length}</strong>
                  <span>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
                </div>
              ))}
            </div>

            {bookingLoading ? (
              <div className="adm__bookings-list">
                {Array(4).fill(0).map((_,i) => <div key={i} className="skeleton adm__bk-skel" />)}
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="adm__empty"><span>◎</span><p>No bookings match your filters.</p></div>
            ) : (
              <div className="adm__bookings-list">
                {filteredBookings.map(b => {
                  const st = b.status || 'new'
                  const sc = STATUS_COLORS[st]
                  const isOpen = expandedBooking === b.id
                  return (
                    <div key={b.id} className={`adm__bk-row ${st}`}>
                      <div className="adm__bk-row-head" onClick={() => setExpandedBooking(isOpen ? null : b.id)}>
                        <div className="adm__bk-left">
                          <div className="adm__bk-avatar">{b.name?.[0]?.toUpperCase()}</div>
                          <div className="adm__bk-name">
                            <strong>{b.name}</strong>
                            <span>{b.email}{b.phone ? ` · ${b.phone}` : ''}</span>
                          </div>
                        </div>
                        <div className="adm__bk-right">
                          <span className="adm__bk-pkg">{b.package_name || b.session_type || '—'}</span>
                          {b.package_price && <span className="adm__bk-price">£{b.package_price}</span>}
                          <span className="adm__bk-status-badge" style={{ background: sc?.bg, color: sc?.color }}>
                            {st}
                          </span>
                          <span className="adm__bk-chevron">{isOpen ? '▲' : '▼'}</span>
                        </div>
                      </div>

                      {isOpen && (
                        <div className="adm__bk-details">
                          <div className="adm__bk-grid">
                            <div className="adm__bk-cell"><span>Date Requested</span><strong>{b.preferred_date ? format(new Date(b.preferred_date), 'd MMMM yyyy') : '—'}</strong></div>
                            <div className="adm__bk-cell"><span>Location</span><strong>{b.location || '—'}</strong></div>
                            <div className="adm__bk-cell"><span>Deposit Due</span><strong style={{ color: 'var(--orange)' }}>{b.deposit_due ? `£${b.deposit_due}` : '—'}</strong></div>
                            <div className="adm__bk-cell"><span>How They Found Us</span><strong>{b.how_heard || '—'}</strong></div>
                            <div className="adm__bk-cell"><span>Outfit Notes</span><strong>{b.outfit_notes || '—'}</strong></div>
                            <div className="adm__bk-cell"><span>Submitted</span><strong>{format(new Date(b.created_at), 'd MMM yyyy · HH:mm')}</strong></div>
                          </div>

                          {b.message && (
                            <div className="adm__bk-message">
                              <span>Client Message</span>
                              <p>{b.message}</p>
                            </div>
                          )}

                          <div className="adm__bk-actions">
                            <div className="adm__bk-action-group">
                              <label>Update Status</label>
                              <select value={st} onChange={e => updateStatus(b.id, e.target.value)} className="adm__status-select">
                                {STATUS_OPTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                              </select>
                            </div>
                            <div className="adm__bk-action-links">
                              <a href={`mailto:${b.email}?subject=Your GoBig Photography Booking`} className="btn-primary" style={{ fontSize: 12, padding: '9px 18px' }}>
                                📧 Email Client
                              </a>
                              {b.phone && (
                                <a href={`tel:${b.phone}`} className="btn-outline" style={{ fontSize: 12, padding: '8px 18px' }}>
                                  📞 Call
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
