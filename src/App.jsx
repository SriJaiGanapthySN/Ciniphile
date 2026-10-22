import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { SiteProvider } from './context.jsx'
import { useSite } from './lib/site-context.js'
import { isPublic } from './lib/content.js'
import { FilmCursor, Footer, Header } from './components.jsx'
import {
  Contact,
  Home,
  Houses,
  NotFound,
  Privacy,
  ProfileDetail,
  ProjectDetail,
  UpdateDetail,
  Updates,
  Work,
} from './pages.jsx'

const Admin = lazy(() => import('./Admin.jsx'))
const Login = lazy(() =>
  import('./Admin.jsx').then((module) => ({ default: module.Login })),
)

function RouteEffects() {
  const { pathname, hash } = useLocation()
  const { content } = useSite()
  useEffect(() => {
    const names = {
      '/': 'For the love of cinema',
      '/work': 'Our work',
      '/houses': 'Five houses. One collective',
      '/updates': 'The journal',
      '/contact': 'Start a conversation',
      '/privacy': 'Privacy & permission',
      '/login': 'Team access',
      '/admin': 'Admin studio',
    }
    const collection = pathname.startsWith('/work/')
      ? 'projects'
      : pathname.startsWith('/updates/')
        ? 'updates'
        : 'profiles'
    const entry = content[collection].find(
      (item) =>
        item.id === pathname.split('/')[2] && isPublic(collection, item),
    )
    document.title = `${names[pathname] || entry?.title || 'A missing frame'} | Cinephile`
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        'content',
        entry?.description ||
          'Cinephile is a creative collective rooted in Tamil cinema. Five houses for ideas, production, film promotion, talent and creator collaborations.',
      )
    document
      .querySelector('meta[name="robots"]')
      ?.setAttribute(
        'content',
        ['/login', '/admin'].includes(pathname)
          ? 'noindex, nofollow'
          : 'index, follow',
      )
  }, [pathname, content])
  useEffect(() => {
    if (hash) {
      const frame = requestAnimationFrame(() =>
        document
          .getElementById(hash.slice(1))
          ?.scrollIntoView({ behavior: 'instant', block: 'start' }),
      )
      return () => cancelAnimationFrame(frame)
    } else window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, hash])
  return null
}

export default function App() {
  const [motionPaused, setMotionPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setReducedMotion(preference.matches)
    preference.addEventListener('change', updatePreference)
    return () => preference.removeEventListener('change', updatePreference)
  }, [])
  return (
    <SiteProvider>
      <BrowserRouter>
        <RouteEffects />
        <FilmCursor paused={motionPaused} />
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <div id="top" />
        <Header
          motionPaused={motionPaused}
          reducedMotion={reducedMotion}
          onMotionPauseChange={setMotionPaused}
        />
        <main
          id="main-content"
          data-site-motion={reducedMotion ? 'reduced' : motionPaused ? 'paused' : 'active'}
        >
          <Suspense
            fallback={
              <div className="page-loading" role="status">
                Opening the studio...
              </div>
            }
          >
            <Routes>
              <Route
                path="/"
                element={
                  <Home
                    motionPaused={motionPaused}
                    reducedMotion={reducedMotion}
                    onMotionPauseChange={setMotionPaused}
                  />
                }
              />
              <Route path="/work" element={<Work />} />
              <Route path="/work/:id" element={<ProjectDetail />} />
              <Route path="/houses" element={<Houses />} />
              <Route path="/people/:id" element={<ProfileDetail />} />
              <Route path="/updates" element={<Updates />} />
              <Route path="/updates/:id" element={<UpdateDetail />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </BrowserRouter>
    </SiteProvider>
  )
}
