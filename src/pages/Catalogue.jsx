import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase, CATEGORIES } from '../lib/supabase'
import { format } from 'date-fns'
import './Catalogue.css'

const ALL_CATS = [{ id: 'all', label: 'All Work', icon: '✦' }, ...CATEGORIES]

export default function Catalogue() {
  const [photos, setPhotos]             = useState([])
  const [loading, setLoading]           = useState(true)
  const [lightbox, setLightbox]         = useState(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const active = searchParams.get('category') || 'all'

  useEffect(() => { fetchPhotos() }, [active])

  async function fetchPhotos() {
    setLoading(true)
    let q = supabase.from('catalogue_items').select('*').order('created_at', { ascending: false })
    if (active !== 'all') q = q.eq('category', active)
    const { data } = await q
    setPhotos(data || [])
    setLoading(false)
  }

  function setCategory(cat) {
    cat === 'all' ? setSearchParams({}) : setSearchParams({ category: cat })
  }

  function openLightbox(p) { setLightbox(p); document.body.style.overflow = 'hidden' }
  function closeLightbox()  { setLightbox(null); document.body.style.overflow = '' }

  useEffect(() => () => { document.body.style.overflow = '' }, [])

  return (
    <div className="cat-page">
      <div className="cat-hero">
        <div className="wrap">
          <p className="label">Portfolio</p>
          <h1 className="cat-title">The Work</h1>
          <p className="cat-sub">A curated collection spanning portraits, families, maternity, street &amp; events — all captured with the GoBig standard.</p>
        </div>
      </div>

      {/* Filter */}
      <div className="cat-filter-wrap">
        <div className="cat-filter wrap">
          {ALL_CATS.map(c => (
            <button
              key={c.id}
              className={`cat-filter__btn ${active === c.id ? 'active' : ''}`}
              onClick={() => setCategory(c.id)}
            >
              <span>{c.icon}</span> {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="wrap cat-body">
        {loading ? (
          <div className="cat-grid">
            {Array(9).fill(0).map((_, i) => (
              <div key={i} className="skeleton cat-skel" style={{ aspectRatio: [1.2,0.75,1][i%3] }} />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="cat-empty">
            <span>◎</span>
            <h3>No photos here yet</h3>
            <p>Check back soon — new work is always being added.</p>
          </div>
        ) : (
          <div className="cat-grid">
            {photos.map((p, i) => (
              <div
                key={p.id}
                className="cat-photo"
                onClick={() => openLightbox(p)}
                style={{ animationDelay: `${(i % 9) * 0.06}s` }}
              >
                <div className="cat-photo__img-wrap">
                  <img src={p.image_url} alt={p.title} loading="lazy" />
                </div>
                <div className="cat-photo__overlay">
                  <span className="label">{CATEGORIES.find(c => c.id === p.category)?.label || p.category}</span>
                  <h3>{p.title}</h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="lightbox" onClick={closeLightbox}>
          <button className="lightbox__close" onClick={closeLightbox}>✕</button>
          <div className="lightbox__box" onClick={e => e.stopPropagation()}>
            <img src={lightbox.image_url} alt={lightbox.title} />
            <div className="lightbox__info">
              <span className="label">{CATEGORIES.find(c => c.id === lightbox.category)?.label}</span>
              <h2>{lightbox.title}</h2>
              {lightbox.description && <p>{lightbox.description}</p>}
              <time>{format(new Date(lightbox.created_at), 'd MMMM yyyy')}</time>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}