import { Fragment, useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  Aperture,
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  ExternalLink,
  KeyRound,
  Camera as Instagram,
  BriefcaseBusiness as Linkedin,
  Menu,
  Pause,
  Play,
  Plus,
  Scan,
  X,
  SquarePlay as Youtube,
} from 'lucide-react'
import { HOUSES, TAMIL_CINEMA } from './data.js'
import { useSite } from './lib/site-context.js'
import { formatDate, safeUrl, videoEmbed } from './lib/content.js'

const CURRENT_YEAR = new Date().getFullYear()

export function FilmCursor({ paused }) {
  const layerRef = useRef(null)
  const positionRef = useRef(null)
  const pulseRef = useRef(null)
  const { pathname } = useLocation()
  const disabled = paused || /^\/(admin|login)(\/|$)/.test(pathname)

  useEffect(() => {
    const layer = layerRef.current
    const cursor = positionRef.current
    const pulse = pulseRef.current
    const preference = window.matchMedia(
      '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
    )
    let frame = null
    let positioned = false
    let target = { x: 0, y: 0 }
    let position = { x: 0, y: 0 }
    let preview = null
    const resetPreview = () => {
      preview?.style.removeProperty('--preview-x')
      preview?.style.removeProperty('--preview-y')
      preview = null
    }
    const hide = () => {
      layer.dataset.active = 'false'
      layer.dataset.pressed = 'false'
      positioned = false
      resetPreview()
      if (frame !== null) cancelAnimationFrame(frame)
      frame = null
      pulse.getAnimations().forEach((animation) => animation.cancel())
    }
    hide()
    if (disabled) return hide
    const follow = () => {
      position.x += (target.x - position.x) * 0.24
      position.y += (target.y - position.y) * 0.24
      cursor.style.transform = `translate3d(${position.x - 16}px, ${position.y - 16}px, 0)`
      if (preview && !preview.isConnected) resetPreview()
      if (preview) {
        const bounds = preview.getBoundingClientRect()
        const horizontal = (target.x - bounds.left) / bounds.width - 0.5
        const vertical = (target.y - bounds.top) / bounds.height - 0.5
        preview.style.setProperty(
          '--preview-x',
          `${horizontal * bounds.width * -0.035}px`,
        )
        preview.style.setProperty(
          '--preview-y',
          `${vertical * bounds.height * -0.035}px`,
        )
      }
      frame =
        Math.abs(target.x - position.x) + Math.abs(target.y - position.y) > 0.1
          ? requestAnimationFrame(follow)
          : null
    }
    const move = (event) => {
      if (
        !preference.matches ||
        event.pointerType !== 'mouse' ||
        event.target.closest(
          'input, textarea, select, [contenteditable="true"], dialog',
        )
      ) {
        hide()
        return
      }
      target = { x: event.clientX, y: event.clientY }
      const nextPreview = event.target.closest('.project-image, .update-image')
      if (nextPreview !== preview) {
        resetPreview()
        preview = nextPreview
      }
      if (!positioned) {
        position = { ...target }
        positioned = true
      }
      layer.dataset.active = 'true'
      layer.dataset.interactive = String(
        Boolean(
          event.target.closest(
            'a, button:not(:disabled), summary, [role="button"]',
          ),
        ),
      )
      if (frame === null) frame = requestAnimationFrame(follow)
    }
    const press = (event) => {
      if (event.pointerType !== 'mouse' || !preference.matches) {
        hide()
        return
      }
      if (layer.dataset.active !== 'true') return
      layer.dataset.pressed = 'true'
      pulse.getAnimations().forEach((animation) => animation.cancel())
      pulse.animate(
        [
          { opacity: 0.8, transform: 'scale(0.6)' },
          { opacity: 0, transform: 'scale(2)' },
        ],
        { duration: 460, easing: 'ease-out' },
      )
    }
    const release = () => {
      layer.dataset.pressed = 'false'
    }
    document.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerdown', press, { passive: true })
    document.addEventListener('pointerup', release, { passive: true })
    document.documentElement.addEventListener('pointerleave', hide)
    document.addEventListener('keydown', hide)
    document.addEventListener('visibilitychange', hide)
    window.addEventListener('blur', hide)
    preference.addEventListener('change', hide)
    return () => {
      hide()
      document.removeEventListener('pointermove', move)
      document.removeEventListener('pointerdown', press)
      document.removeEventListener('pointerup', release)
      document.documentElement.removeEventListener('pointerleave', hide)
      document.removeEventListener('keydown', hide)
      document.removeEventListener('visibilitychange', hide)
      window.removeEventListener('blur', hide)
      preference.removeEventListener('change', hide)
    }
  }, [disabled])

  return (
    <div
      className="film-cursor"
      ref={layerRef}
      data-active="false"
      aria-hidden="true"
    >
      <div className="cursor-position" ref={positionRef}>
        <Scan className="cursor-reticle" size={32} strokeWidth={1.3} />
        <span className="cursor-pulse" ref={pulseRef} />
      </div>
    </div>
  )
}

function MotionToggle({
  paused,
  reducedMotion,
  onPauseChange,
  className = '',
}) {
  const label = reducedMotion
    ? 'Animations disabled by system preference'
    : paused
      ? 'Play animations'
      : 'Pause animations'
  return (
    <button
      type="button"
      className={`scene-motion-toggle ${className}`}
      title={label}
      aria-label={label}
      aria-pressed={paused || reducedMotion}
      disabled={reducedMotion}
      onClick={() => onPauseChange(!paused)}
    >
      {paused || reducedMotion ? <Play size={15} /> : <Pause size={15} />}
    </button>
  )
}

export function CinemaMotion({
  children,
  paused,
  reducedMotion,
  onPauseChange,
}) {
  const rootRef = useRef(null)

  useEffect(() => {
    const root = rootRef.current
    const targets = root.querySelectorAll(
      '.section-heading, .cinema-artist, .story-image, .story-copy, .project-card, .house-item, .update-card',
    )
    const scenes = root.querySelectorAll('[data-scroll-scene]')
    if (paused || reducedMotion || !('IntersectionObserver' in window)) {
      targets.forEach((target) => target.setAttribute('data-reveal', 'visible'))
      root.style.setProperty('--scene-x', '0px')
      root.style.setProperty('--scene-y', '0px')
      if (reducedMotion) {
        scenes.forEach((scene) => {
          scene.style.setProperty('--scene-progress', '1')
          scene.style.setProperty('--scene-shift', '0px')
        })
      }
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-reveal', 'visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -24px 0px' },
    )
    targets.forEach((target, index) => {
      target.style.setProperty('--reveal-delay', `${(index % 5) * 55}ms`)
      target.setAttribute('data-reveal', 'waiting')
      observer.observe(target)
    })
    let frame = null
    const updateScroll = () => {
      if (frame !== null) return
      frame = requestAnimationFrame(() => {
        const range = root.scrollHeight - window.innerHeight
        const progress =
          range > 0 ? Math.min(1, Math.max(0, window.scrollY / range)) : 0
        root.style.setProperty('--reading-progress', String(progress))
        scenes.forEach((scene) => {
          const bounds = scene.getBoundingClientRect()
          const sceneProgress = Math.min(
            1,
            Math.max(
              0,
              (window.innerHeight - bounds.top) /
                (window.innerHeight + bounds.height),
            ),
          )
          scene.style.setProperty('--scene-progress', String(sceneProgress))
          scene.style.setProperty(
            '--scene-shift',
            `${(sceneProgress - 0.5) * 28}px`,
          )
        })
        frame = null
      })
    }
    const hero = root.querySelector('.hero')
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    let pointerFrame = null
    let pointerPosition = { x: 0, y: 0 }
    const updatePointer = (event) => {
      if (event.pointerType !== 'mouse' || !finePointer.matches) return
      pointerPosition = { x: event.clientX, y: event.clientY }
      if (pointerFrame !== null) return
      pointerFrame = requestAnimationFrame(() => {
        const bounds = hero.getBoundingClientRect()
        const horizontal =
          (pointerPosition.x - bounds.left) / bounds.width - 0.5
        const vertical = (pointerPosition.y - bounds.top) / bounds.height - 0.5
        root.style.setProperty('--scene-x', `${horizontal * 8}px`)
        root.style.setProperty('--scene-y', `${vertical * 6}px`)
        pointerFrame = null
      })
    }
    const resetPointer = () => {
      if (pointerFrame !== null) cancelAnimationFrame(pointerFrame)
      pointerFrame = null
      root.style.setProperty('--scene-x', '0px')
      root.style.setProperty('--scene-y', '0px')
    }
    hero.addEventListener('pointermove', updatePointer, { passive: true })
    hero.addEventListener('pointerleave', resetPointer)
    window.addEventListener('scroll', updateScroll, { passive: true })
    window.addEventListener('resize', updateScroll)
    updateScroll()
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', updateScroll)
      window.removeEventListener('resize', updateScroll)
      hero.removeEventListener('pointermove', updatePointer)
      hero.removeEventListener('pointerleave', resetPointer)
      resetPointer()
      if (frame !== null) cancelAnimationFrame(frame)
      targets.forEach((target) => target.setAttribute('data-reveal', 'visible'))
    }
  }, [paused, reducedMotion])

  const control = (
    <MotionToggle
      paused={paused}
      reducedMotion={reducedMotion}
      onPauseChange={onPauseChange}
    />
  )

  return (
    <div
      ref={rootRef}
      className="home-experience"
      data-motion={reducedMotion ? 'reduced' : paused ? 'paused' : 'active'}
    >
      <div className="reading-progress" aria-hidden="true" />
      {children(control)}
    </div>
  )
}

export function CinemaInterlude() {
  return (
    <section
      className="cinema-interlude"
      aria-label="Feel the frame. Make it matter."
      data-scroll-scene
    >
      <div className="container">
        <div className="interlude-topline">
          <span>THE CINEPHILE WAY</span>
          <span>IDEAS / IMAGES / IMPACT</span>
        </div>
        <div className="interlude-type" aria-hidden="true">
          <div className="interlude-line">
            <span>FEEL</span> <em>the frame.</em>
          </div>
          <div className="interlude-line">
            <em>Make it</em>{' '}
            <span className="interlude-outline" data-word="MATTER.">
              MATTER.
            </span>
          </div>
        </div>
        <div className="interlude-bottomline">
          <span className="interlude-signature">
            <Aperture className="interlude-reel" size={36} aria-hidden="true" />
            <span>
              TAMIL ROOTS.
              <br />
              LIMITLESS PERSPECTIVES.
            </span>
          </span>
          <ArrowLink to="/work">See what we make</ArrowLink>
        </div>
      </div>
    </section>
  )
}

export function Brand({ footer = false }) {
  return (
    <Link
      to="/"
      className={`brand${footer ? ' brand-footer' : ''}`}
      aria-label="Cinephile home"
    >
      <img src="/logo.png" alt="" width="358" height="164" />
    </Link>
  )
}

export function Header({ motionPaused, reducedMotion, onMotionPauseChange }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const { admin } = useSite()
  const closeMenu = () => setMenuOpen(false)
  useEffect(() => {
    if (!menuOpen) return
    function onKey(event) {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])
  return (
    <header className={`site-header ${pathname === '/' ? 'header-home' : ''}`}>
      <div className="header-inner">
        <div onClick={closeMenu}>
          <Brand />
        </div>
        <nav
          className={`main-nav ${menuOpen ? 'nav-open' : ''}`}
          aria-label="Main navigation"
          id="main-navigation"
        >
          {[
            ['/', 'Home'],
            ['/work', 'Work'],
            ['/houses', 'Houses'],
            ['/about', 'About'],
            ['/updates', 'Updates'],
            ['/join', 'Join us'],
          ].map(([path, text]) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              onClick={closeMenu}
            >
              {text}
            </NavLink>
          ))}
          {admin && (
            <NavLink to="/admin" onClick={closeMenu}>
              Admin
            </NavLink>
          )}
          <NavLink to="/contact" className="mobile-contact" onClick={closeMenu}>
            Contact
          </NavLink>
        </nav>
        <Link className="header-contact" to="/contact" onClick={closeMenu}>
          Let's talk <ArrowUpRight size={17} />
        </Link>
        <div className="header-tools">
          {!['/', '/login', '/admin'].includes(pathname) && (
            <MotionToggle
              className="header-motion"
              paused={motionPaused}
              reducedMotion={reducedMotion}
              onPauseChange={onMotionPauseChange}
            />
          )}
          {!admin && (
            <NavLink className="header-login" to="/login" onClick={closeMenu}>
              <KeyRound size={15} aria-hidden="true" />
              <span>Login</span>
            </NavLink>
          )}
          <button
            className="icon-button menu-toggle"
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menuOpen}
            aria-controls="main-navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  )
}

export function Footer() {
  const { content, admin } = useSite()
  const { settings } = content
  return (
    <footer className="site-footer">
      <div className="container footer-top">
        <div className="footer-intro">
          <Brand />
          <p>
            A collective of creative minds.
            <br />A shared love for cinema.
          </p>
          <span className="footer-stamp">TAMIL ROOTS. LIMITLESS STORIES.</span>
        </div>
        <div className="footer-links">
          <span className="eyebrow">Explore</span>
          <Link to="/work">Our work</Link>
          <Link to="/houses">The five houses</Link>
          <Link to="/about">About us</Link>
          <Link to="/updates">Latest updates</Link>
          <Link to="/join">Join the team</Link>
          <Link to="/contact">Get in touch</Link>
        </div>
        <div className="footer-links">
          <span className="eyebrow">The houses</span>
          {HOUSES.map((house) => (
            <Link key={house.id} to={`/houses#${house.id}`}>
              {house.name}
            </Link>
          ))}
        </div>
        <div className="footer-connect">
          <span className="eyebrow">
            Good things start with a conversation.
          </span>
          <Link to="/contact" className="footer-hello">
            Say hello <ArrowUpRight />
          </Link>
          <div className="social-links">
            {[
              ['instagram', Instagram],
              ['youtube', Youtube],
              ['linkedin', Linkedin],
            ].map(
              ([key, Icon]) =>
                safeUrl(settings[key]) && (
                  <a
                    key={key}
                    href={safeUrl(settings[key])}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Cinephile on ${key}`}
                    title={key}
                  >
                    <Icon size={19} />
                  </a>
                ),
            )}
          </div>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>&copy; {CURRENT_YEAR} Cinephile. For the love of cinema.</span>
        <div>
          <Link to="/privacy">Privacy & media</Link>
          <Link to={admin ? '/admin' : '/login'}>
            {admin ? 'Admin studio' : 'Admin login'} <ArrowUpRight size={12} />
          </Link>
          <a href="#top" aria-label="Back to top">
            Back to top <ArrowDown className="rotate" size={13} />
          </a>
        </div>
      </div>
      <div className="footer-wordmark" aria-hidden="true">
        CINEPHILE.
      </div>
    </footer>
  )
}

export function ArrowLink({ to, children, className = '' }) {
  return (
    <Link className={`arrow-link ${className}`} to={to}>
      {children}
      <ArrowUpRight size={18} />
    </Link>
  )
}

export function Ticker({ items }) {
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-track">
        {[0, 1].map((copy) => (
          <div className="ticker-group" key={copy}>
            {items.map((item) => (
              <Fragment key={item}>
                <span lang={/[\u0B80-\u0BFF]/.test(item) ? 'ta' : undefined}>
                  {item}
                </span>
                <Aperture />
              </Fragment>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function SectionHeading({ label, title, children, to, linkText }) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">
          <span className="small-line" />
          {label}
        </span>
        <h2>{title}</h2>
        {children && <p>{children}</p>}
      </div>
      {to && <ArrowLink to={to}>{linkText}</ArrowLink>}
    </div>
  )
}

export function PageHeading({ label, title, children }) {
  return (
    <section className="page-heading">
      <div className="container">
        <span className="eyebrow">
          <span className="small-line" />
          {label}
        </span>
        <h1>
          {title}
          <span className="accent">.</span>
        </h1>
        <div className="heading-deck">
          <span className="heading-reel" aria-hidden="true">
            <Aperture size={48} strokeWidth={1} />
            TAMIL ROOTS / LIMITLESS STORIES
          </span>
          {children && <p>{children}</p>}
        </div>
      </div>
    </section>
  )
}

export function TamilCinema() {
  return (
    <section
      className="cinema-section"
      id="tamil-cinema"
      aria-label="Tamil cinema tribute"
    >
      <div className="container">
        <div className="cinema-archive-label">
          <span>
            <Aperture size={18} aria-hidden="true" /> THE CINEPHILE ARCHIVE
          </span>
          <span>VOL. 01 / TAMIL CINEMA</span>
        </div>
        <SectionHeading
          label="FIRST DAY. FIRST SHOW. FOREVER."
          title={
            <>
              The cinema
              <br />
              <em>that made us.</em>
            </>
          }
        >
          The first whistle. The unforgettable entrance. The scene that stays. A
          little love for the artists who make Tamil cinema feel like home.
        </SectionHeading>
        <div className="cinema-gallery">
          {TAMIL_CINEMA.map((artist, index) => (
            <article
              className={`cinema-artist cinema-artist-${artist.id}`}
              key={artist.id}
            >
              <a
                href={artist.filmography}
                target="_blank"
                rel="noreferrer"
                aria-label={`${artist.name}: explore filmography (opens in a new tab)`}
              >
                <span className="cinema-frame-number">
                  <span>{String(index + 1).padStart(2, '0')} / 05</span>
                  <span>{artist.moniker}</span>
                  <span className="cinema-portrait-arrow">
                    <ArrowUpRight size={14} />
                  </span>
                </span>
                <div className="cinema-portrait">
                  <img
                    src={artist.image}
                    alt={artist.name}
                    width="600"
                    height="800"
                    loading="lazy"
                  />
                </div>
                <div className="cinema-artist-title">
                  <h3>{artist.name}</h3>
                </div>
              </a>
              <p className="cinema-artist-note">{artist.note}</p>
              <p className="cinema-films">{artist.films.join(' / ')}</p>
            </article>
          ))}
        </div>
        <div className="cinema-colophon">
          <span className="eyebrow">A CINEPHILE APPRECIATION</span>
          <p>
            An editorial tribute, not a claim of affiliation, endorsement or
            representation. These artists are not listed as Cinephile clients or
            managed talent.
          </p>
        </div>
        <details className="cinema-credits" id="portrait-credits">
          <summary>
            Portrait credits & licenses <Plus size={14} aria-hidden="true" />
          </summary>
          <p>
            Portraits from Coolie, Good Bad Ugly, Leo, Vikram and Karuppu,
            cropped from movie publicity artwork and stills. These are
            local-prototype references, not openly licensed photographs.
            Permission is required before publication.
          </p>
          <ul>
            {TAMIL_CINEMA.map((artist) => (
              <li key={artist.id}>
                <a
                  href={artist.source}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${artist.name} photo source`}
                >
                  {artist.name}
                </a>
                <span>{artist.credit}</span>
                <a href={artist.licenseUrl} target="_blank" rel="noreferrer">
                  {artist.license} <ArrowUpRight size={12} />
                </a>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </section>
  )
}

export function FilterBar({
  items,
  value,
  onChange,
  label = 'Filter by category',
}) {
  return (
    <div className="filter-bar" role="group" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.id}
          aria-pressed={value === item.id}
          className={value === item.id ? 'selected' : ''}
          onClick={() => onChange(item.id)}
        >
          {item.name}
          {item.count !== undefined && (
            <sup>{String(item.count).padStart(2, '0')}</sup>
          )}
        </button>
      ))}
    </div>
  )
}

export function ProjectCard({ project, index = 0 }) {
  const house = HOUSES.find((item) => item.id === project.category)
  return (
    <Link
      to={`/work/${project.id}`}
      className="project-card"
      style={{ '--card-order': Math.min(index, 5) }}
    >
      <div className="project-image">
        <img
          src={safeUrl(project.image, true)}
          alt={project.title}
          loading="lazy"
          width="800"
          height="600"
        />
        <Scan className="preview-frame" strokeWidth={0.3} aria-hidden="true" />
        <span className="project-index">
          {String(index + 1).padStart(2, '0')} / CINEPHILE
        </span>
        {project.sample && <span className="image-label">Concept study</span>}
        <span className="image-arrow">
          <ArrowUpRight size={25} />
        </span>
        <span className="project-poster-title">{project.title}</span>
      </div>
      <div className="project-caption">
        <div>
          <span className="eyebrow">
            {house?.short} <span className="meta-divider">/</span>{' '}
            {project.year}
          </span>
          <h3>{project.title}</h3>
        </div>
        <ArrowUpRight className="caption-arrow" size={22} />
      </div>
      <p>{project.description}</p>
    </Link>
  )
}

export function UpdateCard({ update }) {
  return (
    <article className="update-card">
      <Link to={`/updates/${update.id}`} className="update-image">
        <img
          src={safeUrl(update.image, true)}
          alt={update.title}
          width="700"
          height="440"
          loading="lazy"
        />
        <Scan className="preview-frame" strokeWidth={0.3} aria-hidden="true" />
        <span className="image-arrow">
          <ArrowUpRight />
        </span>
      </Link>
      <div className="update-meta">
        <span>
          {update.category}
          {update.sample ? ' / Sample' : ''}
        </span>
        <time dateTime={update.date}>{formatDate(update.date)}</time>
      </div>
      <h3>
        <Link to={`/updates/${update.id}`}>{update.title}</Link>
      </h3>
      <p>{update.description}</p>
      <ArrowLink to={`/updates/${update.id}`}>Read story</ArrowLink>
    </article>
  )
}

export function HouseAccordion({ initialHouse = 'creative', compact = false }) {
  const [active, setActive] = useState(initialHouse)
  return (
    <div className={`house-list ${compact ? 'house-list-compact' : ''}`}>
      {HOUSES.map((house) => (
        <div
          className={`house-item ${active === house.id ? 'house-open' : ''}`}
          key={house.id}
        >
          <button
            className="house-trigger"
            onClick={() => setActive(active === house.id ? '' : house.id)}
            aria-expanded={active === house.id}
            aria-controls={`house-panel-${house.id}`}
          >
            <span className="house-number">{house.number}</span>
            <span>{house.name}</span>
            <Plus
              className={active === house.id ? 'plus-open' : ''}
              strokeWidth={1}
            />
          </button>
          {active === house.id && (
            <div className="house-panel" id={`house-panel-${house.id}`}>
              <div>
                <h3>{house.tagline}</h3>
                <p>{house.description}</p>
                <div className="service-tags">
                  {house.services.map((service) => (
                    <span key={service}>{service}</span>
                  ))}
                </div>
                <ArrowLink to={`/houses#${house.id}`}>
                  Inside the house
                </ArrowLink>
              </div>
              <img
                src={house.image}
                alt={`${house.short} visual study`}
                loading="lazy"
                width="600"
                height="360"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export function ContactBand() {
  return (
    <section className="contact-band">
      <div className="container">
        <div>
          <span className="eyebrow">THE NEXT GREAT STORY COULD BE YOURS</span>
          <h2>
            Have a spark?
            <br />
            <em>Let's make a scene.</em>
          </h2>
        </div>
        <Link
          to="/contact"
          className="contact-orbit"
          aria-label="Start a conversation"
        >
          <ArrowUpRight strokeWidth={1} />
        </Link>
      </div>
      <div className="container contact-band-bottom">
        <span>Ideas. Collaborations. Conversations.</span>
        <Link to="/contact">
          We're all ears <ArrowRight size={17} />
        </Link>
      </div>
    </section>
  )
}

export function EmptyState({ title, children }) {
  return (
    <div className="empty-state">
      <Aperture size={34} strokeWidth={1.2} />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  )
}

export function Modal({ title, children, onClose, className = '' }) {
  const dialogRef = useRef(null)
  useEffect(() => {
    const dialog = dialogRef.current
    dialog.showModal()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
    }
  }, [])
  return (
    <dialog
      ref={dialogRef}
      className={`modal ${className}`}
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="modal-inner">
        <div className="modal-heading">
          <h2>{title}</h2>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close dialog"
            title="Close dialog"
          >
            <X />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}

export function Video({ url, title }) {
  const embed = videoEmbed(url)
  const [consented, setConsented] = useState(false)
  if (!safeUrl(url)) return null
  if (embed)
    return (
      <div className="video-container">
        {consented ? (
          <iframe
            src={embed}
            title={title}
            allow="fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="video-consent">
            <p>
              This video is hosted by YouTube. Loading it shares your IP address
              with Google.
            </p>
            <button
              className="button button-dark"
              onClick={() => setConsented(true)}
            >
              Load video <ArrowRight size={17} />
            </button>
          </div>
        )}
      </div>
    )
  if (/\.(mp4|webm)(\?.*)?$/i.test(url))
    return (
      <video
        controls
        preload="none"
        className="project-video"
        aria-label={title}
        src={safeUrl(url)}
      />
    )
  return (
    <a
      className="arrow-link"
      href={safeUrl(url)}
      target="_blank"
      rel="noreferrer"
    >
      Watch video <ExternalLink size={17} />
    </a>
  )
}

export function SuccessMessage({ children }) {
  return (
    <div className="success-message" role="status">
      <Check size={20} />
      {children}
    </div>
  )
}

export function Breadcrumb({ to, children }) {
  return (
    <Link to={to} className="breadcrumb">
      <ChevronRight className="rotate-90" size={15} />
      {children}
    </Link>
  )
}
