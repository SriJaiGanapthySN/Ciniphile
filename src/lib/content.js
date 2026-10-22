import {
  HOUSES,
  INITIAL_CONTENT,
  RELATIONSHIPS,
  UPDATE_CATEGORIES,
} from '../data.js'

export const CONTENT_KEY = 'cinephile.content.v1'
export const SESSION_KEY = 'cinephile.demo-session'
export const DEMO_ADMIN = {
  email: 'admin@cinephile.demo',
  password: 'Cinephile@2026',
}
export const COLLECTIONS = ['projects', 'updates', 'profiles']

export function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false
  const date = new Date(`${value}T12:00:00Z`)
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  )
}

export function safeUrl(value, allowLocal = false) {
  if (!value || typeof value !== 'string') return ''
  if (
    allowLocal &&
    /^\/images\/[a-zA-Z0-9._/-]+$/.test(value) &&
    !value.includes('..')
  )
    return value
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password
      ? url.href
      : ''
  } catch {
    return ''
  }
}

export function profileApproved(profile) {
  return (
    profile.listingApproved === true &&
    profile.mediaApproved === true &&
    Boolean(profile.permissionNote?.trim()) &&
    validDate(profile.consentDate) &&
    (profile.relationship !== 'Represented talent' ||
      profile.representationApproved === true)
  )
}

export function isPublic(collection, entry) {
  return (
    entry.status === 'published' &&
    (collection === 'profiles'
      ? profileApproved(entry)
      : entry.mediaApproved === true)
  )
}

export function entryError(collection, entry) {
  if (!COLLECTIONS.includes(collection)) return 'Unknown content type.'
  if (!entry.title?.trim())
    return collection === 'profiles'
      ? 'A name is required.'
      : 'A title is required.'
  if (!entry.description?.trim()) return 'A short description is required.'
  if (!safeUrl(entry.image, true))
    return 'Add an HTTPS image URL or a local /images/ path.'
  if (!['draft', 'published'].includes(entry.status))
    return 'Choose draft or published.'
  if (
    collection === 'projects' &&
    !HOUSES.some((house) => house.id === entry.category)
  )
    return 'Choose a house.'
  if (collection === 'updates' && !UPDATE_CATEGORIES.includes(entry.category))
    return 'Choose an update category.'
  if (collection === 'updates' && !validDate(entry.date))
    return 'Choose a valid publication date.'
  if (collection === 'profiles' && !RELATIONSHIPS.includes(entry.relationship))
    return 'Choose the relationship to Cinephile.'
  if (entry.videoUrl && !safeUrl(entry.videoUrl))
    return 'Video links must use HTTPS.'
  if (entry.externalUrl && !safeUrl(entry.externalUrl))
    return 'External links must use HTTPS.'
  if (entry.socialUrl && !safeUrl(entry.socialUrl))
    return 'Social links must use HTTPS.'
  if (entry.gallery?.some((image) => !safeUrl(image, true)))
    return 'Every gallery image must have a valid image URL.'
  if (
    entry.status === 'published' &&
    collection === 'profiles' &&
    !profileApproved(entry)
  )
    return 'Record listing and media permission, a consent date and a permission reference. Represented talent also needs representation approval.'
  if (
    entry.status === 'published' &&
    collection !== 'profiles' &&
    entry.mediaApproved !== true
  )
    return 'Confirm media rights before publishing.'
  return ''
}

export function settingsError(settings) {
  if (settings.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email))
    return 'Enter a valid official email address.'
  if (settings.phone && !/^\+?[\d ()-]{5,25}$/.test(settings.phone))
    return 'Enter a valid phone number.'
  if (settings.whatsapp && !/^\+?[\d ()-]{5,25}$/.test(settings.whatsapp))
    return 'Enter a valid WhatsApp number including its country code.'
  if (
    ['instagram', 'youtube', 'linkedin'].some(
      (key) => settings[key] && !safeUrl(settings[key]),
    )
  )
    return 'Social links must be valid HTTPS URLs.'
  return ''
}

export function authenticate(email, password) {
  return (
    email.trim().toLowerCase() === DEMO_ADMIN.email &&
    password === DEMO_ADMIN.password
  )
}

export function validateBackup(value) {
  if (
    !value ||
    value.version !== 1 ||
    !value.settings ||
    typeof value.settings !== 'object'
  )
    return false
  if (!Array.isArray(value.enquiries)) return false
  if (
    !value.enquiries.every(
      (entry) =>
        entry &&
        ['id', 'name', 'email', 'type', 'message', 'date'].every(
          (key) => typeof entry[key] === 'string',
        ),
    )
  )
    return false
  if (
    !Object.keys(INITIAL_CONTENT.settings).every(
      (key) => typeof value.settings[key] === 'string',
    )
  )
    return false
  if (settingsError(value.settings)) return false
  for (const collection of COLLECTIONS) {
    if (!Array.isArray(value[collection])) return false
    const ids = new Set()
    for (const entry of value[collection]) {
      if (
        !entry ||
        typeof entry.id !== 'string' ||
        !/^[a-zA-Z0-9-]+$/.test(entry.id) ||
        ids.has(entry.id)
      )
        return false
      if (
        ['title', 'description', 'image', 'status'].some(
          (key) => typeof entry[key] !== 'string',
        )
      )
        return false
      if (
        [
          'body',
          'role',
          'credits',
          'videoUrl',
          'externalUrl',
          'socialUrl',
          'permissionNote',
          'consentDate',
          'year',
          'type',
          'relationship',
        ].some(
          (key) => entry[key] !== undefined && typeof entry[key] !== 'string',
        )
      )
        return false
      if (
        entry.gallery !== undefined &&
        (!Array.isArray(entry.gallery) ||
          entry.gallery.some((item) => typeof item !== 'string'))
      )
        return false
      if (
        entry.projectIds !== undefined &&
        (!Array.isArray(entry.projectIds) ||
          entry.projectIds.some((item) => typeof item !== 'string'))
      )
        return false
      if (entryError(collection, entry)) return false
      ids.add(entry.id)
    }
  }
  return true
}

export function loadContent(storage) {
  try {
    const stored = JSON.parse(storage.getItem(CONTENT_KEY))
    if (validateBackup(stored)) return stored
  } catch {
    return structuredClone(INITIAL_CONTENT)
  }
  return structuredClone(INITIAL_CONTENT)
}

export function formatDate(value) {
  if (!validDate(value)) return 'Date to be confirmed'
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T12:00:00Z`))
}

export function videoEmbed(value) {
  if (!safeUrl(value)) return ''
  const url = new URL(value)
  let videoId = ''
  if (url.hostname === 'youtu.be') videoId = url.pathname.slice(1)
  if (
    ['youtube.com', 'www.youtube.com', 'www.youtube-nocookie.com'].includes(
      url.hostname,
    )
  ) {
    videoId =
      url.searchParams.get('v') ||
      (url.pathname.startsWith('/embed/') ? url.pathname.split('/')[2] : '')
  }
  return /^[a-zA-Z0-9_-]{11}$/.test(videoId)
    ? `https://www.youtube-nocookie.com/embed/${videoId}`
    : ''
}
