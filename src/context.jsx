import { useState } from 'react'
import {
  CONTENT_KEY,
  DEMO_ADMIN,
  SESSION_KEY,
  authenticate,
  entryError,
  loadContent,
  validateBackup,
} from './lib/content.js'
import { SiteContext } from './lib/site-context.js'
import { INITIAL_CONTENT } from './data.js'

export function SiteProvider({ children }) {
  const [content, setContent] = useState(() => {
    try {
      return loadContent(localStorage)
    } catch {
      return structuredClone(INITIAL_CONTENT)
    }
  })
  const [admin, setAdmin] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) === DEMO_ADMIN.email
    } catch {
      return false
    }
  })

  function commit(next) {
    try {
      localStorage.setItem(CONTENT_KEY, JSON.stringify(next))
      setContent(next)
      return ''
    } catch {
      return 'Browser storage is unavailable or full. Nothing was saved. Export a backup or enable browser storage.'
    }
  }

  function login(email, password) {
    if (!authenticate(email, password))
      return 'These credentials do not match the demo administrator.'
    try {
      sessionStorage.setItem(SESSION_KEY, DEMO_ADMIN.email)
      setAdmin(true)
      return ''
    } catch {
      return 'Enable browser storage to use the demo admin.'
    }
  }

  function logout() {
    setAdmin(false)
    try {
      sessionStorage.removeItem(SESSION_KEY)
    } catch {
      return
    }
  }

  function saveEntry(collection, entry) {
    if (!admin) return 'Sign in as the demo administrator first.'
    const error = entryError(collection, entry)
    if (error) return error
    const entries = content[collection]
    return commit({
      ...content,
      [collection]: entries.some((item) => item.id === entry.id)
        ? entries.map((item) => (item.id === entry.id ? entry : item))
        : [entry, ...entries],
    })
  }

  function removeEntry(collection, id) {
    if (
      !admin ||
      !['projects', 'updates', 'profiles', 'enquiries'].includes(collection)
    )
      return 'Administrator access required.'
    return commit({
      ...content,
      [collection]: content[collection].filter((entry) => entry.id !== id),
    })
  }

  function saveSettings(settings) {
    if (!admin) return 'Administrator access required.'
    return commit({ ...content, settings })
  }

  function restoreContent(value) {
    if (!admin) return 'Administrator access required.'
    if (!validateBackup(value))
      return 'This is not a valid Cinephile backup. No content was changed.'
    return commit(value)
  }

  function addEnquiry(enquiry) {
    const last = content.enquiries[0]
    if (last && Date.now() - new Date(last.date).getTime() < 30000)
      return 'Please wait 30 seconds before sending another enquiry.'
    return commit({
      ...content,
      enquiries: [
        { ...enquiry, id: crypto.randomUUID(), date: new Date().toISOString() },
        ...content.enquiries,
      ],
    })
  }

  return (
    <SiteContext.Provider
      value={{
        content,
        admin,
        login,
        logout,
        saveEntry,
        removeEntry,
        saveSettings,
        restoreContent,
        addEnquiry,
      }}
    >
      {children}
    </SiteContext.Provider>
  )
}
