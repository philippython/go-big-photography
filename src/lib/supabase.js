import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL     || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const STORAGE_BUCKET = 'catalogue-images'

export const CATEGORIES = [
  { id: 'weddings',   label: 'Weddings',   icon: '💍' },
  { id: 'portraits',  label: 'Portraits',  icon: '🖼️' },
  { id: 'events',     label: 'Events',     icon: '🎉' },
  { id: 'landscapes', label: 'Landscapes', icon: '🌄' },
  { id: 'commercial', label: 'Commercial', icon: '📸' },
  { id: 'street',     label: 'Street',     icon: '🌆' },
]

export const BRAND = {
  name:         'GoBig Photography',
  nameShort:    'GoBig',
  photographer: 'Gbolahan Ogundipe',
  email:        'hellogobigphotography@gmail.com',
  phone:        '+44 7903987131',
  location:     'London, United Kingdom',
  experience:   '5 Years',
  tagline:      'Bold. Powerful. Unforgettable.',
  social: {
    instagram: 'https://www.instagram.com/gobig_photography_',
  },
}

/** Active packages only — used on public pages */
export async function fetchPackages() {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true })
  if (error) { console.error('fetchPackages:', error); return [] }
  return data || []
}

/** All packages including inactive — used in admin panel */
export async function fetchAllPackages() {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) { console.error('fetchAllPackages:', error); return [] }
  return data || []
}