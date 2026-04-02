import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const STORAGE_BUCKET = 'catalogue-images'

export const CATEGORIES = [
  { id: 'weddings',   label: 'Weddings',    icon: '💍' },
  { id: 'portraits',  label: 'Portraits',   icon: '🖼️' },
  { id: 'events',     label: 'Events',      icon: '🎉' },
  { id: 'landscapes', label: 'Landscapes',  icon: '🌄' },
  { id: 'commercial', label: 'Commercial',  icon: '📸' },
  { id: 'street',     label: 'Street',      icon: '🌆' },
]

export const BRAND = {
  name:      'GoBig Photography',
  nameShort: 'GoBig',
  photographer: 'Gbolahan Ogundipe',
  email:     'hellogobigphotography@gmail.com',
  phone:     '+44 7903987131',
  location:  'London, United Kingdom',
  experience: '5 Years',
  tagline:   'Bold. Powerful. Unforgettable.',
  social: {
    instagram: 'https://www.instagram.com/gobig_photography_',
  }
}

export const PACKAGES = [
  {
    id: 'quick-portrait',
    emoji: '📸',
    name: 'Quick Portrait Session',
    duration: '45 minutes',
    price: 150,
    images: 5,
    outfits: 1,
    popular: false,
    category: 'portrait',
    desc: 'A simple, stylish photoshoot designed to capture your best look with ease and confidence. Perfect for one outfit and one person, with professional guidance throughout.',
  },
  {
    id: 'elite-portrait',
    emoji: '🔥',
    name: 'Elite Portrait Session',
    duration: '1 hr 30 min',
    price: 220,
    images: 10,
    outfits: 2,
    popular: true,
    category: 'portrait',
    desc: 'A relaxed and creative session with two outfit changes, giving you more variety and a complete, standout look. Perfect for personal branding, special moments, or elevating your image.',
  },
  {
    id: 'family',
    emoji: '👨‍👩‍👧',
    name: 'Family Portrait Session',
    duration: '1 hour',
    price: 200,
    images: 5,
    outfits: 1,
    popular: false,
    category: 'family',
    desc: 'A warm and natural family-focused session designed to capture genuine connections and timeless memories in a relaxed and enjoyable environment.',
  },
  {
    id: 'elite-family',
    emoji: '🔥',
    name: 'Elite Family Session',
    duration: '1 hr 30 min',
    price: 320,
    images: 10,
    outfits: 2,
    popular: false,
    category: 'family',
    desc: 'A premium family experience with two outfit changes, offering a mix of classic and creative styles to beautifully tell your family story.',
  },
  {
    id: 'maternity',
    emoji: '🤰',
    name: 'Maternity Session',
    duration: '1 hour',
    price: 185,
    images: 5,
    outfits: 1,
    popular: false,
    category: 'maternity',
    desc: 'A gentle and beautifully guided session designed to celebrate your pregnancy journey. Capturing your natural glow, strength, and the special connection you already share with your baby.',
  },
  {
    id: 'elite-maternity',
    emoji: '🔥',
    name: 'Elite Maternity Session',
    duration: '1 hr 30 min',
    price: 250,
    images: 10,
    outfits: 2,
    popular: false,
    category: 'maternity',
    desc: 'A more intimate and expressive maternity experience with two outfit changes. Soft, elegant, and timeless images you and your family will cherish forever.',
  },
  {
    id: 'street',
    emoji: '🏙️',
    name: 'Street / Lifestyle Session',
    duration: '1 hour',
    price: 170,
    images: 5,
    outfits: 1,
    popular: false,
    category: 'street',
    desc: 'A creative outdoor shoot designed to capture natural, stylish, and expressive moments. Perfect for personal branding, content creation, or showcasing your unique vibe.',
  },
  {
    id: 'elite-street',
    emoji: '🔥',
    name: 'Elite Street Session',
    duration: '2 hours',
    price: 300,
    images: 10,
    outfits: 2,
    popular: false,
    category: 'street',
    desc: 'A dynamic and immersive street session with two outfit changes, multiple locations, and a strong storytelling approach to give you bold and standout visuals.',
  },
]
