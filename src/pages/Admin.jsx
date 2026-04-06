import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { supabase, CATEGORIES, STORAGE_BUCKET, BRAND, fetchAllPackages } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'
import Logo from '../components/Logo'
import './Admin.css'

const TABS = [
  { id: 'upload',    label: 'Upload Photos', icon: '↑'  },
  { id: 'catalogue', label: 'Catalogue',     icon: '⊞'  },
  { id: 'packages',  label: 'Packages',      icon: '🏷️' },
  { id: 'bookings',  label: 'Bookings',      icon: '📋' },
]

const STATUS_OPTS   = ['new','contacted','confirmed','completed','cancelled','declined']
const STATUS_COLORS = {
  new:       { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b' },
  contacted: { bg: 'rgba(59,130,246,0.12)',  color: '#60a5fa' },
  confirmed: { bg: 'rgba(22,163,74,0.12)',   color: '#4ade80' },
  completed: { bg: 'rgba(255,255,255,0.06)', color: '#888'    },
  cancelled: { bg: 'rgba(220,38,38,0.12)',   color: '#f87171' },
  declined:  { bg: 'rgba(220,38,38,0.08)',   color: '#fca5a5' },
}

const EMPTY_PKG = {
  name: '', description: '', price: '', duration: '',
  images: '', outfits: '', emoji: '📸', category: 'portrait',
  popular: false, active: true, sort_order: 0,
}

export default function Admin() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('upload')

  // ── Upload ──────────────────────────────────────────────
  const [files, setFiles]           = useState([])
  const [upForm, setUpForm]         = useState({ title: '', category: '', description: '' })
  const [uploading, setUploading]   = useState(false)
  const [upProgress, setUpProgress] = useState([])
  const [upDone, setUpDone]         = useState(false)
  const [upError, setUpError]       = useState('')

  // ── Catalogue ───────────────────────────────────────────
  const [photos, setPhotos]             = useState([])
  const [photoLoading, setPhotoLoading] = useState(false)
  const [catFilter, setCatFilter]       = useState('all')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]         = useState(false)

  // ── Packages ────────────────────────────────────────────
  const [packages, setPackages]         = useState([])
  const [pkgLoading, setPkgLoading]     = useState(false)
  const [editingPkg, setEditingPkg]     = useState(null)   // null | 'new' | pkg object
  const [pkgForm, setPkgForm]           = useState({ ...EMPTY_PKG })
  const [pkgSaving, setPkgSaving]       = useState(false)
  const [pkgError, setPkgError]         = useState('')
  const [pkgFetchError, setPkgFetchError] = useState('')
  const [deletePkg, setDeletePkg]       = useState(null)

  // ── Bookings ────────────────────────────────────────────
  const [bookings, setBookings]             = useState([])
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingSearch, setBookingSearch]   = useState('')
  const [bookingStatus, setBookingStatus]   = useState('all')
  const [expandedBooking, setExpandedBooking] = useState(null)
  const [cancelTarget, setCancelTarget]     = useState(null)
  const [cancelling, setCancelling]         = useState(false)
  const [bookingFetchError, setBookingFetchError] = useState('')

  useEffect(() => {
    if (tab === 'catalogue') fetchPhotos()
    if (tab === 'packages')  loadPackages()
    if (tab === 'bookings')  fetchBookings()
  }, [tab, catFilter])

  // ── Dropzone ─────────────────────────────────────────────
  const onDrop = useCallback(accepted => {
    setFiles(p => [...p, ...accepted.map(f => Object.assign(f, { preview: URL.createObjectURL(f) }))])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxSize: 20 * 1024 * 1024,
  })

  // ── Upload handlers ──────────────────────────────────────
  async function handleUpload() {
    if (!files.length)    { setUpError('Please add at least one photo.'); return }
    if (!upForm.title)    { setUpError('Please enter a title.');           return }
    if (!upForm.category) { setUpError('Please select a category.');       return }
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
        title, category: upForm.category, description: upForm.description,
        image_url: urlData.publicUrl, storage_path: path,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }])
      setUpProgress(p => p.map((v, idx) => idx === i ? 100 : v))
    }

    setUploading(false); setUpDone(true)
    setFiles([]); setUpForm({ title: '', category: '', description: '' })
    setTimeout(() => setUpDone(false), 4000)
  }

  // ── Catalogue handlers ───────────────────────────────────
  async function fetchPhotos() {
    setPhotoLoading(true)
    let q = supabase.from('catalogue_items').select('*').order('created_at', { ascending: false })
    if (catFilter !== 'all') q = q.eq('category', catFilter)
    const { data } = await q
    setPhotos(data || []); setPhotoLoading(false)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    await supabase.storage.from(STORAGE_BUCKET).remove([deleteTarget.storage_path])
    await supabase.from('catalogue_items').delete().eq('id', deleteTarget.id)
    setDeleteTarget(null); setDeleting(false); fetchPhotos()
  }

  // ── Package handlers ─────────────────────────────────────
  async function loadPackages() {
    setPkgLoading(true)
    setPkgFetchError('')
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .order('sort_order', { ascending: true })
    if (error) {
      setPkgFetchError('Could not load packages — make sure you have run supabase-schema.sql and your Supabase keys in .env are correct. Error: ' + error.message)
      setPackages([])
    } else {
      setPackages(data || [])
    }
    setPkgLoading(false)
  }

  function openNewPkg() {
    setPkgForm({ ...EMPTY_PKG, sort_order: packages.length })
    setEditingPkg('new')
    setPkgError('')
  }

  function openEditPkg(pkg) {
    setPkgForm({
      name:        pkg.name        || '',
      description: pkg.description || '',
      price:       pkg.price       ?? '',
      duration:    pkg.duration    || '',
      images:      pkg.images      ?? '',
      outfits:     pkg.outfits     ?? '',
      emoji:       pkg.emoji       || '📸',
      category:    pkg.category    || 'portrait',
      popular:     pkg.popular     || false,
      active:      pkg.active      !== false,
      sort_order:  pkg.sort_order  ?? 0,
    })
    setEditingPkg(pkg)
    setPkgError('')
  }

  async function savePkg() {
    if (!pkgForm.name.trim())  { setPkgError('Package name is required.'); return }
    if (!pkgForm.price)        { setPkgError('Price is required.'); return }
    setPkgSaving(true); setPkgError('')

    const payload = {
      name:        pkgForm.name.trim(),
      description: pkgForm.description.trim(),
      price:       parseFloat(pkgForm.price),
      duration:    pkgForm.duration.trim(),
      images:      pkgForm.images ? parseInt(pkgForm.images) : null,
      outfits:     pkgForm.outfits ? parseInt(pkgForm.outfits) : null,
      emoji:       pkgForm.emoji || '📸',
      category:    pkgForm.category,
      popular:     !!pkgForm.popular,
      active:      !!pkgForm.active,
      sort_order:  parseInt(pkgForm.sort_order) || 0,
      updated_at:  new Date().toISOString(),
    }

    if (editingPkg === 'new') {
      const { error } = await supabase.from('packages').insert([{ ...payload, created_at: new Date().toISOString() }])
      if (error) { setPkgError('Failed to create package: ' + error.message); setPkgSaving(false); return }
    } else {
      const { error } = await supabase.from('packages').update(payload).eq('id', editingPkg.id)
      if (error) { setPkgError('Failed to update package: ' + error.message); setPkgSaving(false); return }
    }

    setPkgSaving(false); setEditingPkg(null)
    loadPackages()
  }

  async function togglePkgActive(pkg) {
    await supabase.from('packages').update({ active: !pkg.active, updated_at: new Date().toISOString() }).eq('id', pkg.id)
    loadPackages()
  }

  async function confirmDeletePkg() {
    if (!deletePkg) return
    await supabase.from('packages').delete().eq('id', deletePkg.id)
    setDeletePkg(null); loadPackages()
  }

  // ── Booking handlers ─────────────────────────────────────
  async function fetchBookings() {
    setBookingLoading(true)
    setBookingFetchError('')
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      setBookingFetchError('Could not load bookings. Make sure you have run supabase-schema.sql. Error: ' + error.message)
      setBookings([])
    } else {
      setBookings(data || [])
    }
    setBookingLoading(false)
  }

  async function updateStatus(id, status) {
    await supabase.from('bookings').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    setBookings(b => b.map(bk => bk.id === id ? { ...bk, status } : bk))
  }

  async function confirmCancel() {
    if (!cancelTarget) return
    setCancelling(true)
    await supabase.from('bookings').update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    }).eq('id', cancelTarget.id)
    setBookings(b => b.map(bk => bk.id === cancelTarget.id ? { ...bk, status: 'cancelled' } : bk))
    setCancelTarget(null); setCancelling(false)
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
      {/* ── Sidebar ── */}
      <aside className="adm__sidebar">
        <div className="adm__sidebar-logo"><Logo size="sm" /></div>
        <nav className="adm__nav">
          {TABS.map(t => (
            <button key={t.id} className={`adm__nav-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
              <span className="adm__nav-icon">{t.icon}</span>
              <span className="adm__nav-label">{t.label}</span>
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

      {/* ── Main ── */}
      <main className="adm__main">

        {/* ════════ UPLOAD TAB ════════ */}
        {tab === 'upload' && (
          <div className="adm__section">
            <div className="adm__header">
              <h1>Upload Photos</h1>
              <p>Add new work to the public portfolio. JPG, PNG, WebP — max 20MB each.</p>
            </div>

            {upDone  && <div className="adm__banner success">✓ Photos uploaded successfully — live in your portfolio!</div>}
            {upError && <div className="adm__banner error">{upError}</div>}

            <div className="up-layout">
              <div className="up-left">
                <div {...getRootProps()} className={`up-zone ${isDragActive ? 'drag' : ''}`}>
                  <input {...getInputProps()} />
                  <div className="up-zone__icon">↑</div>
                  <p>{isDragActive ? "Drop it — let's go 🔥" : 'Drag & drop photos here'}</p>
                  <span>or click to browse · max 20MB per file</span>
                </div>

                {files.length > 0 && (
                  <div className="up-previews">
                    <p className="up-previews__count">{files.length} file{files.length !== 1 ? 's' : ''} ready</p>
                    <div className="up-previews__grid">
                      {files.map((f, i) => (
                        <div key={i} className="up-preview">
                          <img src={f.preview} alt="" />
                          <button className="up-preview__rm" onClick={() => setFiles(fl => fl.filter((_, j) => j !== i))}>✕</button>
                          {uploading && (
                            <div className="up-preview__bar"><div style={{ width: `${upProgress[i] || 0}%` }} /></div>
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
                    <textarea rows={3} value={upForm.description} onChange={e => setUpForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description…" />
                  </div>
                  <button className="btn-primary up-submit" onClick={handleUpload} disabled={uploading || !files.length}>
                    {uploading ? 'Uploading…' : `Upload ${files.length > 0 ? files.length + ' ' : ''}Photo${files.length !== 1 ? 's' : ''} →`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════ CATALOGUE TAB ════════ */}
        {tab === 'catalogue' && (
          <div className="adm__section">
            <div className="adm__header">
              <h1>Manage Catalogue</h1>
              <p>Browse, filter and remove photos from the public portfolio.</p>
            </div>

            <div className="adm__cat-filter">
              {allCats.map(c => (
                <button key={c.id} className={`cat-filter__btn ${catFilter === c.id ? 'active' : ''}`} onClick={() => setCatFilter(c.id)}>
                  {c.label}
                </button>
              ))}
            </div>

            {photoLoading ? (
              <div className="adm__photo-grid">{Array(8).fill(0).map((_, i) => <div key={i} className="skeleton adm__photo-skel" />)}</div>
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

            {deleteTarget && (
              <div className="adm__modal-overlay" onClick={() => setDeleteTarget(null)}>
                <div className="adm__modal" onClick={e => e.stopPropagation()}>
                  <h3>Delete Photo?</h3>
                  <p>This will permanently remove <strong>"{deleteTarget.title}"</strong> from the catalogue and storage. Cannot be undone.</p>
                  <div className="adm__modal-actions">
                    <button className="btn-outline" onClick={() => setDeleteTarget(null)}>Cancel</button>
                    <button className="adm__btn-danger" onClick={confirmDelete} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete Permanently'}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════ PACKAGES TAB ════════ */}
        {tab === 'packages' && (
          <div className="adm__section">
            <div className="adm__header adm__header--row">
              <div>
                <h1>Manage Packages</h1>
                <p>Add, edit, toggle visibility, reorder and delete session packages. Changes go live on the website immediately.</p>
              </div>
              <button className="btn-primary" onClick={openNewPkg}>+ Add Package</button>
            </div>

            {pkgFetchError && (
              <div className="adm__banner error" style={{ marginBottom: 20 }}>
                ⚠️ {pkgFetchError}
              </div>
            )}

            {pkgLoading ? (
              <div className="pkg-admin-list">{Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 80 }} />)}</div>
            ) : !pkgFetchError && packages.length === 0 ? (
              <div className="adm__empty">
                <span>🏷️</span>
                <p>No packages yet. Add your first one!</p>
                <button className="btn-primary" style={{ marginTop: 16 }} onClick={openNewPkg}>+ Add Package</button>
              </div>
            ) : (
              <div className="pkg-admin-list">
                {packages.map(pkg => (
                  <div key={pkg.id} className={`pkg-admin-row ${!pkg.active ? 'inactive' : ''}`}>
                    <div className="pkg-admin-row__left">
                      <span className="pkg-admin-row__emoji">{pkg.emoji || '📸'}</span>
                      <div className="pkg-admin-row__info">
                        <div className="pkg-admin-row__name">
                          {pkg.name}
                          {pkg.popular && <span className="pkg-pop-badge">Popular</span>}
                          {!pkg.active && <span className="pkg-hidden-badge">Hidden</span>}
                        </div>
                        <div className="pkg-admin-row__meta">
                          <span>£{pkg.price}</span>
                          {pkg.duration && <span>· {pkg.duration}</span>}
                          {pkg.images   && <span>· {pkg.images} images</span>}
                          <span>· {pkg.category}</span>
                        </div>
                      </div>
                    </div>
                    <div className="pkg-admin-row__actions">
                      <button
                        className={`pkg-toggle ${pkg.active ? 'on' : 'off'}`}
                        onClick={() => togglePkgActive(pkg)}
                        title={pkg.active ? 'Hide from website' : 'Show on website'}
                      >
                        {pkg.active ? '● Live' : '○ Hidden'}
                      </button>
                      <button className="btn-outline pkg-edit-btn" onClick={() => openEditPkg(pkg)}>Edit</button>
                      <button className="adm__btn-danger-sm" onClick={() => setDeletePkg(pkg)} title="Delete package">🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Package edit / create modal */}
            {editingPkg !== null && (
              <div className="adm__modal-overlay" onClick={() => setEditingPkg(null)}>
                <div className="adm__modal adm__modal--wide" onClick={e => e.stopPropagation()}>
                  <h3>{editingPkg === 'new' ? 'Add New Package' : `Edit: ${editingPkg.name}`}</h3>

                  {pkgError && <div className="adm__banner error" style={{ marginBottom: 16 }}>{pkgError}</div>}

                  <div className="pkg-form-grid">
                    <div className="uf-group">
                      <label>Package Name *</label>
                      <input value={pkgForm.name} onChange={e => setPkgForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Elite Portrait Session" />
                    </div>
                    <div className="uf-group">
                      <label>Price (£) *</label>
                      <input type="number" min="0" value={pkgForm.price} onChange={e => setPkgForm(f => ({ ...f, price: e.target.value }))} placeholder="220" />
                    </div>
                    <div className="uf-group">
                      <label>Duration</label>
                      <input value={pkgForm.duration} onChange={e => setPkgForm(f => ({ ...f, duration: e.target.value }))} placeholder="e.g. 1 hr 30 min" />
                    </div>
                    <div className="uf-group">
                      <label>Edited Images Included</label>
                      <input type="number" min="0" value={pkgForm.images} onChange={e => setPkgForm(f => ({ ...f, images: e.target.value }))} placeholder="10" />
                    </div>
                    <div className="uf-group">
                      <label>Outfit Changes</label>
                      <input type="number" min="0" value={pkgForm.outfits} onChange={e => setPkgForm(f => ({ ...f, outfits: e.target.value }))} placeholder="2" />
                    </div>
                    <div className="uf-group">
                      <label>Emoji Icon</label>
                      <input value={pkgForm.emoji} onChange={e => setPkgForm(f => ({ ...f, emoji: e.target.value }))} placeholder="📸" style={{ fontSize: 20 }} />
                    </div>
                    <div className="uf-group">
                      <label>Category</label>
                      <select value={pkgForm.category} onChange={e => setPkgForm(f => ({ ...f, category: e.target.value }))}>
                        <option value="portrait">Portrait</option>
                        <option value="family">Family</option>
                        <option value="maternity">Maternity</option>
                        <option value="street">Street</option>
                        <option value="wedding">Wedding</option>
                        <option value="event">Event</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="uf-group">
                      <label>Display Order</label>
                      <input type="number" min="0" value={pkgForm.sort_order} onChange={e => setPkgForm(f => ({ ...f, sort_order: e.target.value }))} placeholder="0" />
                    </div>
                    <div className="uf-group uf-group--full">
                      <label>Description</label>
                      <textarea rows={3} value={pkgForm.description} onChange={e => setPkgForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe this session…" />
                    </div>
                    <div className="uf-group uf-group--checkboxes">
                      <label className="uf-checkbox">
                        <input type="checkbox" checked={pkgForm.popular} onChange={e => setPkgForm(f => ({ ...f, popular: e.target.checked }))} />
                        <span>Mark as Most Popular</span>
                      </label>
                      <label className="uf-checkbox">
                        <input type="checkbox" checked={pkgForm.active} onChange={e => setPkgForm(f => ({ ...f, active: e.target.checked }))} />
                        <span>Active (visible on website)</span>
                      </label>
                    </div>
                  </div>

                  <div className="adm__modal-actions">
                    <button className="btn-outline" onClick={() => setEditingPkg(null)}>Cancel</button>
                    <button className="btn-primary" onClick={savePkg} disabled={pkgSaving}>
                      {pkgSaving ? 'Saving…' : editingPkg === 'new' ? 'Create Package' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Delete package modal */}
            {deletePkg && (
              <div className="adm__modal-overlay" onClick={() => setDeletePkg(null)}>
                <div className="adm__modal" onClick={e => e.stopPropagation()}>
                  <h3>Delete Package?</h3>
                  <p>This will permanently remove <strong>"{deletePkg.name}"</strong>. Existing bookings that reference this package will not be affected. This cannot be undone.</p>
                  <div className="adm__modal-actions">
                    <button className="btn-outline" onClick={() => setDeletePkg(null)}>Cancel</button>
                    <button className="adm__btn-danger" onClick={confirmDeletePkg}>Delete Package</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════ BOOKINGS TAB ════════ */}
        {tab === 'bookings' && (
          <div className="adm__section">
            <div className="adm__header">
              <h1>Booking Enquiries</h1>
              <p>All enquiries from the booking form — click a row to expand. Cancel or update status as needed.</p>
            </div>

            {/* Search + filter */}
            <div className="adm__booking-toolbar">
              <input className="adm__search" placeholder="Search name, email or package…" value={bookingSearch} onChange={e => setBookingSearch(e.target.value)} />
              <div className="adm__status-tabs">
                {['all', ...STATUS_OPTS].map(s => (
                  <button key={s} className={`adm__status-tab ${bookingStatus === s ? 'active' : ''}`} onClick={() => setBookingStatus(s)}>
                    {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary counts */}
            <div className="adm__bookings-summary">
              <div className="adm__summary-card"><strong>{bookings.length}</strong><span>Total</span></div>
              {STATUS_OPTS.map(s => (
                <div key={s} className="adm__summary-card">
                  <strong style={{ color: STATUS_COLORS[s]?.color }}>{bookings.filter(b => (b.status || 'new') === s).length}</strong>
                  <span>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
                </div>
              ))}
            </div>

            {bookingFetchError && (
              <div className="adm__banner error" style={{ marginBottom: 20 }}>
                ⚠️ {bookingFetchError}
              </div>
            )}

            {bookingLoading ? (
              <div className="adm__bookings-list">{Array(4).fill(0).map((_, i) => <div key={i} className="skeleton adm__bk-skel" />)}</div>
            ) : !bookingFetchError && filteredBookings.length === 0 ? (
              <div className="adm__empty"><span>◎</span><p>No bookings match your filters.</p></div>
            ) : (
              <div className="adm__bookings-list">
                {filteredBookings.map(b => {
                  const st = b.status || 'new'
                  const sc = STATUS_COLORS[st]
                  const isOpen = expandedBooking === b.id
                  const isCancelled = st === 'cancelled'
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
                          <span className="adm__bk-status-badge" style={{ background: sc?.bg, color: sc?.color }}>{st}</span>
                          <span className="adm__bk-date">{format(new Date(b.created_at), 'd MMM yy')}</span>
                          <span className="adm__bk-chevron">{isOpen ? '▲' : '▼'}</span>
                        </div>
                      </div>

                      {isOpen && (
                        <div className="adm__bk-details">
                          <div className="adm__bk-grid">
                            <div className="adm__bk-cell"><span>Preferred Date</span><strong>{b.preferred_date ? format(new Date(b.preferred_date), 'd MMMM yyyy') : '—'}</strong></div>
                            <div className="adm__bk-cell"><span>Location</span><strong>{b.location || '—'}</strong></div>
                            <div className="adm__bk-cell"><span>Deposit Due</span><strong style={{ color: 'var(--orange)' }}>{b.deposit_due ? `£${b.deposit_due}` : '—'}</strong></div>
                            <div className="adm__bk-cell"><span>Total Price</span><strong>{b.package_price ? `£${b.package_price}` : '—'}</strong></div>
                            <div className="adm__bk-cell"><span>Outfit Notes</span><strong>{b.outfit_notes || '—'}</strong></div>
                            <div className="adm__bk-cell"><span>How Found Us</span><strong>{b.how_heard || '—'}</strong></div>
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
                              <select value={st} onChange={e => updateStatus(b.id, e.target.value)} className="adm__status-select" disabled={isCancelled}>
                                {STATUS_OPTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                              </select>
                            </div>
                            <div className="adm__bk-action-links">
                              <a href={`mailto:${b.email}?subject=Your GoBig Photography Booking`} className="btn-primary" style={{ fontSize: 12, padding: '9px 18px' }}>
                                📧 Email Client
                              </a>
                              {b.phone && (
                                <a href={`tel:${b.phone}`} className="btn-outline" style={{ fontSize: 12, padding: '8px 18px' }}>📞 Call</a>
                              )}
                              {!isCancelled && (
                                <button className="adm__btn-danger-sm adm__cancel-btn" onClick={() => setCancelTarget(b)}>
                                  ✕ Cancel Booking
                                </button>
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

            {/* Cancel confirmation modal */}
            {cancelTarget && (
              <div className="adm__modal-overlay" onClick={() => setCancelTarget(null)}>
                <div className="adm__modal" onClick={e => e.stopPropagation()}>
                  <h3>Cancel This Booking?</h3>
                  <p>
                    You're about to cancel the booking for <strong>{cancelTarget.name}</strong> ({cancelTarget.package_name || 'unknown package'}).
                    The status will be set to <strong>Cancelled</strong>. This cannot be undone from the app.
                  </p>
                  <div className="adm__modal-actions">
                    <button className="btn-outline" onClick={() => setCancelTarget(null)}>Keep Booking</button>
                    <button className="adm__btn-danger" onClick={confirmCancel} disabled={cancelling}>
                      {cancelling ? 'Cancelling…' : 'Yes, Cancel Booking'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}