import { useDeferredValue, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Aperture,
  Check,
  Camera as Instagram,
  BriefcaseBusiness as Linkedin,
  Mail,
  MapPin,
  Phone,
  Search,
  Send,
  X,
  SquarePlay as Youtube,
} from 'lucide-react'
import {
  HOUSES,
  IMAGES,
  TAMIL_CINEMA,
  ENQUIRY_TYPES,
  UPDATE_CATEGORIES,
} from './data.js'
import { useSite } from './lib/site-context.js'
import { formatDate, isPublic, safeUrl } from './lib/content.js'
import {
  ArrowLink,
  Breadcrumb,
  CinemaInterlude,
  CinemaMotion,
  ContactBand,
  EmptyState,
  FilterBar,
  HouseAccordion,
  PageHeading,
  ProjectCard,
  SectionHeading,
  TamilCinema,
  UpdateCard,
  Video,
} from './components.jsx'

export function Home({ motionPaused, reducedMotion, onMotionPauseChange }) {
  const { content } = useSite()
  const [category, setCategory] = useState('all')
  const published = content.projects.filter((project) =>
    isPublic('projects', project),
  )
  const projects =
    category === 'all'
      ? [
          ...published.filter((project) => project.featured),
          ...published.filter((project) => !project.featured),
        ].slice(0, 3)
      : published.filter((project) => project.category === category).slice(0, 3)
  const updates = content.updates
    .filter((update) => isPublic('updates', update))
    .sort((first, second) => second.date.localeCompare(first.date))
    .slice(0, 3)
  return (
    <CinemaMotion
      paused={motionPaused}
      reducedMotion={reducedMotion}
      onPauseChange={onMotionPauseChange}
    >
      {(motionControl) => (
        <>
          <section className="hero" aria-label="Cinephile creative collective">
            <div
              className="hero-portraits"
              role="img"
              aria-label={`${TAMIL_CINEMA.map((artist) => artist.name).join(', ')}: a tribute to Tamil cinema`}
            >
              {TAMIL_CINEMA.map((artist, index) => (
                <figure
                  className={`hero-portrait hero-portrait-${artist.id}`}
                  key={artist.id}
                >
                  <img
                    src={artist.image}
                    alt=""
                    fetchPriority={index === 2 ? 'high' : 'auto'}
                    width="600"
                    height="800"
                  />
                  <figcaption aria-hidden="true">
                    <span>{artist.name}</span>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
            <div className="hero-reel-note" aria-hidden="true">
              CHENNAI / FOR THE LOVE OF CINEMA
            </div>
            <div className="hero-topnote">
              <span>
                <Aperture size={12} aria-hidden="true" />
                A LOVE LETTER TO TAMIL CINEMA.
              </span>
              <span className="hero-edition">
                FROM THE FIRST WHISTLE TO THE FINAL FRAME.
              </span>
            </div>
            <div className="container hero-content">
              <h1 aria-label="Cinephile.">
                <span className="hero-wordmark" aria-hidden="true">
                  {Array.from('CINEPHILE.').map((letter, index) => (
                    <span
                      className={`hero-letter${letter === '.' ? ' hero-period' : ''}`}
                      style={{ '--letter-index': index }}
                      key={`${letter}-${index}`}
                    >
                      {letter}
                    </span>
                  ))}
                </span>
              </h1>
              <div className="hero-bottom">
                <p>
                  Raised on first-day whistles.
                  <br />
                  <em>Here for the stories that stay.</em>
                </p>
                <Link className="button button-dark" to="/work">
                  Explore our work <ArrowUpRight size={19} />
                </Link>
                <Link className="hero-houses" to="/houses">
                  <span className="hero-five">05</span>
                  <span>
                    Distinct houses.
                    <br />
                    One creative spirit.
                  </span>
                  <ArrowUpRight size={21} />
                </Link>
              </div>
            </div>
            <div className="hero-foot">
              <span>VANAKKAM, CINEMA.</span>
              <a href="#tamil-cinema" className="scroll-link">
                The cinema that made us <ArrowDown size={16} />
              </a>
              <div className="hero-playback">
                <span className="hero-timecode">AN EDITORIAL TRIBUTE</span>
                {motionControl}
              </div>
            </div>
          </section>
          <div className="ticker" aria-hidden="true">
            <div className="ticker-track">
              {[0, 1].map((copy) => (
                <div className="ticker-group" key={copy}>
                  <span>FIRST DAY. FIRST SHOW.</span>
                  <Aperture />
                  <span>TAMIL ROOTS. TIMELESS STORIES.</span>
                  <Aperture />
                  <span>FOR THE LOVE OF CINEMA.</span>
                  <Aperture />
                  <span>FIVE HOUSES. ONE OBSESSION.</span>
                  <Aperture />
                </div>
              ))}
            </div>
          </div>
          <TamilCinema />
          <section
            className="container story-section section-space"
            id="our-story"
          >
            <div className="story-side">
              <span className="eyebrow">
                <span className="small-line" />
                THE OPENING SCENE
              </span>
              <div className="story-image">
                <img
                  src={IMAGES.film}
                  alt="Film equipment and the tools of visual storytelling"
                  loading="lazy"
                  width="500"
                  height="620"
                />
                <span>EVERY STORY STARTS SOMEWHERE.</span>
              </div>
            </div>
            <div className="story-copy">
              <h2>
                Cinema brought
                <br />
                us together.
                <br />
                <em>
                  Stories move
                  <br />
                  us forward.
                </em>
              </h2>
              <p>
                From the first flicker of a moving image to the unmistakable
                spirit of Tamil cinema, stories have always brought people
                together. Cinephile is born from that same love.
              </p>
              <p>
                We are a creative collective where ideas find their form, films
                find their audience, and talent finds its next chapter. Five
                houses. Many perspectives. One shared belief: make something
                that means something.
              </p>
              <div className="story-values">
                <div>
                  <span className="eyebrow">OUR MOTTO</span>
                  <p>
                    Rooted in cinema.
                    <br />
                    Driven by possibility.
                  </p>
                </div>
                <div>
                  <span className="eyebrow">OUR VISION</span>
                  <p>
                    Tamil stories.
                    <br />A world of connection.
                  </p>
                </div>
              </div>
              <ArrowLink to="/houses">Meet the collective</ArrowLink>
            </div>
          </section>
          <CinemaInterlude />
          <section className="work-section section-space">
            <div className="container">
              <SectionHeading
                label="THE WORK"
                title={
                  <>
                    Different stories.
                    <br />
                    <em>Same obsession.</em>
                  </>
                }
                to="/work"
                linkText="View all work"
              />
              <FilterBar
                items={[
                  { id: 'all', name: 'All work' },
                  ...HOUSES.map((house) => ({
                    id: house.id,
                    name: house.short,
                  })),
                ]}
                value={category}
                onChange={setCategory}
              />
              <div className="projects-grid">
                {projects.map((project, index) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    index={index}
                  />
                ))}
              </div>
              {!projects.length && (
                <EmptyState title="A new story is taking shape.">
                  Work from this house will appear here when it is ready.
                </EmptyState>
              )}
              <p className="sample-note">
                A selection of illustrative concept studies. Real curiosity,
                imagined briefs.
              </p>
            </div>
          </section>
          <section className="houses-section section-space">
            <div className="container">
              <SectionHeading
                label="THE COLLECTIVE"
                title={
                  <>
                    Five houses.
                    <br />
                    <em>One creative address.</em>
                  </>
                }
                to="/houses"
                linkText="Explore our houses"
              >
                From a spark of an idea to the people it reaches.
                <br />A house for every part of the story.
              </SectionHeading>
              <HouseAccordion compact />
            </div>
          </section>
          <section className="container updates-section section-space">
            <SectionHeading
              label="ON OUR RADAR"
              title={
                <>
                  Notes from
                  <br />
                  <em>behind the scenes.</em>
                </>
              }
              to="/updates"
              linkText="All updates"
            />
            <div className="updates-grid">
              {updates.map((update) => (
                <UpdateCard key={update.id} update={update} />
              ))}
            </div>
            {!updates.length && (
              <EmptyState title="The next chapter is on its way.">
                Official updates will appear here.
              </EmptyState>
            )}
          </section>
          <ContactBand />
        </>
      )}
    </CinemaMotion>
  )
}

export function Work() {
  const { content } = useSite()
  const [params, setParams] = useSearchParams()
  const category = HOUSES.some((house) => house.id === params.get('house'))
    ? params.get('house')
    : 'all'
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())
  const published = content.projects.filter((project) =>
    isPublic('projects', project),
  )
  const projects = published.filter(
    (project) =>
      (category === 'all' || category === project.category) &&
      `${project.title} ${project.description} ${project.role}`
        .toLowerCase()
        .includes(deferredQuery),
  )
  return (
    <>
      <PageHeading
        label="THE CINEPHILE PORTFOLIO"
        title={
          <>
            Made of ideas.
            <br />
            <em>Made to be felt</em>
          </>
        }
      >
        Different disciplines. One unmistakable love for storytelling.
      </PageHeading>
      <section className="container portfolio-section">
        <div className="portfolio-toolbar">
          <FilterBar
            items={[
              { id: 'all', name: 'All work', count: published.length },
              ...HOUSES.map((house) => ({
                id: house.id,
                name: house.short,
                count: published.filter(
                  (project) => project.category === house.id,
                ).length,
              })),
            ]}
            value={category}
            onChange={(value) =>
              setParams(value === 'all' ? {} : { house: value })
            }
          />
          <label className="search-field">
            <Search size={18} />
            <input
              aria-label="Search projects"
              placeholder="Find a story"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query && (
              <button
                className="icon-button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </label>
        </div>
        <div className="portfolio-count" role="status">
          {String(projects.length).padStart(2, '0')}{' '}
          {projects.length === 1 ? 'PROJECT' : 'PROJECTS'}{' '}
          <span>CURIOUS MINDS. CONSIDERED WORK.</span>
        </div>
        <div className="projects-grid portfolio-grid">
          {projects.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>
        {!projects.length && (
          <EmptyState title="No stories in this frame.">
            Try another house or a different search.
          </EmptyState>
        )}
        <p className="sample-note">
          Projects marked "Concept study" are fictional briefs, not client
          commissions or release announcements.
        </p>
      </section>
      <ContactBand />
    </>
  )
}

export function ProjectDetail({ entry, preview = false }) {
  const { id } = useParams()
  const { content } = useSite()
  const project =
    entry ||
    content.projects.find(
      (item) => item.id === id && isPublic('projects', item),
    )
  if (!project) return <NotFound />
  const house = HOUSES.find((item) => item.id === project.category)
  const related = content.projects
    .filter(
      (item) =>
        item.id !== project.id &&
        isPublic('projects', item) &&
        item.category === project.category,
    )
    .slice(0, 2)
  return (
    <>
      <article className="detail-page">
        <div className="container detail-heading">
          <Breadcrumb to="/work">All work</Breadcrumb>
          <div className="detail-tags">
            <span className="eyebrow">
              {house?.name} / {project.year}
            </span>
            {project.sample && <span className="pill">Concept study</span>}
            {preview && <span className="pill">Unpublished preview</span>}
          </div>
          <h1>
            {project.title}
            <span className="accent">.</span>
          </h1>
          <p>{project.description}</p>
        </div>
        <div className="container">
          <img
            className="detail-hero"
            src={safeUrl(project.image, true)}
            alt={project.title}
            width="1400"
            height="850"
          />
          <div className="detail-body">
            <aside>
              <div>
                <span className="eyebrow">THE HOUSE</span>
                <Link to={`/houses#${project.category}`}>
                  {house?.name} <ArrowUpRight size={15} />
                </Link>
              </div>
              <div>
                <span className="eyebrow">OUR ROLE</span>
                <p>{project.role || 'Creative collaboration'}</p>
              </div>
              <div>
                <span className="eyebrow">THE FORMAT</span>
                <p>{project.type || 'Creative project'}</p>
              </div>
              {project.credits && (
                <div>
                  <span className="eyebrow">CREDITS</span>
                  <p className="preserve-lines">{project.credits}</p>
                </div>
              )}
            </aside>
            <div className="editorial-copy">
              <span className="eyebrow">BEHIND THE FRAME</span>
              <h2>A story, thoughtfully told.</h2>
              {(project.body || project.description)
                .split('\n')
                .filter(Boolean)
                .map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              {project.sample && (
                <div className="editorial-note">
                  This is an illustrative concept project. It does not represent
                  a commissioned film, client partnership or released
                  production.
                </div>
              )}
              {safeUrl(project.externalUrl) && (
                <a
                  className="arrow-link"
                  href={safeUrl(project.externalUrl)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Official project link <ArrowUpRight size={18} />
                </a>
              )}
              <ArrowLink to={`/contact?type=${project.category}`}>
                Create with {house?.short || 'us'}
              </ArrowLink>
            </div>
          </div>
          <div className="gallery">
            {project.gallery?.map((image, index) => (
              <img
                src={safeUrl(image, true)}
                alt={`${project.title}, visual ${index + 1}`}
                key={`${image}-${index}`}
                loading="lazy"
                width="800"
                height="600"
              />
            ))}
          </div>
          <Video url={project.videoUrl} title={`${project.title} video`} />
        </div>
      </article>
      {!preview && related.length > 0 && (
        <section className="container section-space">
          <SectionHeading
            label="KEEP EXPLORING"
            title="Another point of view."
          />
          <div className="projects-grid">
            {related.map((item) => (
              <ProjectCard key={item.id} project={item} />
            ))}
          </div>
        </section>
      )}
      {!preview && <ContactBand />}
    </>
  )
}

export function Houses() {
  const { content } = useSite()
  const profiles = content.profiles.filter((profile) =>
    isPublic('profiles', profile),
  )
  return (
    <>
      <PageHeading
        label="FIVE HOUSES. ONE COLLECTIVE."
        title={
          <>
            An idea needs
            <br />
            <em>a place to belong</em>
          </>
        }
      >
        Ours has five. Independent disciplines, working in harmony to bring a
        story to life.
      </PageHeading>
      <nav
        className="container house-jump-links"
        aria-label="Explore each house"
      >
        {HOUSES.map((house) => (
          <a key={house.id} href={`#${house.id}`}>
            <span>{house.number}</span>
            {house.short}
            <ArrowDown size={14} />
          </a>
        ))}
      </nav>
      <div className="house-chapters">
        {HOUSES.map((house) => {
          const projects = content.projects
            .filter(
              (project) =>
                project.category === house.id && isPublic('projects', project),
            )
            .slice(0, 2)
          return (
            <section id={house.id} className="house-chapter" key={house.id}>
              <div className="container house-chapter-inner">
                <div className="house-chapter-visual">
                  <img
                    src={house.image}
                    alt={`${house.short} visual direction`}
                    loading="lazy"
                    width="800"
                    height="800"
                  />
                  <span className="chapter-number">{house.number}</span>
                </div>
                <div className="house-chapter-copy">
                  <span className="eyebrow">
                    THE {house.number} HOUSE / CINEPHILE
                  </span>
                  <h2>
                    {house.name}
                    <span className="accent">.</span>
                  </h2>
                  <h3>{house.tagline}</h3>
                  <p>{house.description}</p>
                  <ul className="services-list">
                    {house.services.map((service) => (
                      <li key={service}>
                        <Check size={15} />
                        {service}
                      </li>
                    ))}
                  </ul>
                  <div className="house-actions">
                    <Link
                      className="button button-dark"
                      to={`/contact?type=${house.id}`}
                    >
                      Let's create together <ArrowUpRight size={17} />
                    </Link>
                    <ArrowLink to={`/work?house=${house.id}`}>
                      View work
                    </ArrowLink>
                  </div>
                  {projects.length > 0 && (
                    <div className="house-work-samples">
                      <span className="eyebrow">FROM THIS HOUSE</span>
                      {projects.map((project) => (
                        <Link to={`/work/${project.id}`} key={project.id}>
                          {project.title}
                          {project.sample && <span>Concept</span>}
                          <ArrowUpRight size={15} />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )
        })}
      </div>
      <section className="container people-section section-space">
        <SectionHeading
          label="THE PEOPLE"
          title={
            <>
              Talent, with
              <br />
              <em>a point of view.</em>
            </>
          }
          to="/contact?type=talent"
          linkText="Talent & collaboration enquiries"
        />
        {profiles.length ? (
          <div className="profiles-grid">
            {profiles.map((profile) => (
              <Link
                className="profile-card"
                to={`/people/${profile.id}`}
                key={profile.id}
              >
                <img
                  src={safeUrl(profile.image, true)}
                  alt={profile.title}
                  loading="lazy"
                  width="500"
                  height="600"
                />
                <span className="eyebrow">{profile.relationship}</span>
                <h3>{profile.title}</h3>
                <p>{profile.role}</p>
                <ArrowUpRight size={20} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="people-empty">
            <Aperture size={38} strokeWidth={1} />
            <div>
              <h3>Good company. Great possibilities.</h3>
              <p>
                Our public directory is being curated. For talent, team or
                creator collaborations, start a conversation with the house.
              </p>
            </div>
            <ArrowLink to="/contact?type=talent">
              Meet through a conversation
            </ArrowLink>
          </div>
        )}
      </section>
      <ContactBand />
    </>
  )
}

export function ProfileDetail({ entry, preview = false }) {
  const { id } = useParams()
  const { content } = useSite()
  const profile =
    entry ||
    content.profiles.find(
      (item) => item.id === id && isPublic('profiles', item),
    )
  if (!profile) return <NotFound />
  const projects = content.projects.filter(
    (project) =>
      profile.projectIds?.includes(project.id) && isPublic('projects', project),
  )
  return (
    <article className="container profile-detail section-space">
      <Breadcrumb to="/houses">The collective</Breadcrumb>
      <div className="profile-detail-grid">
        <img
          src={safeUrl(profile.image, true)}
          alt={profile.title}
          width="600"
          height="750"
        />
        <div>
          <span className="eyebrow">
            {profile.relationship}
            {preview && ' / PREVIEW'}
          </span>
          <h1>{profile.title}</h1>
          <h2>{profile.role}</h2>
          <p>{profile.description}</p>
          {profile.body && <p className="preserve-lines">{profile.body}</p>}
          {safeUrl(profile.socialUrl) && (
            <a
              className="arrow-link"
              href={safeUrl(profile.socialUrl)}
              target="_blank"
              rel="noreferrer"
            >
              Official social profile <ArrowUpRight size={18} />
            </a>
          )}
          <Link
            className="button button-dark"
            to={`/contact?type=${profile.relationship === 'Influencer partner' ? 'influencer' : 'talent'}`}
          >
            Collaboration enquiry <ArrowUpRight size={17} />
          </Link>
        </div>
      </div>
      {projects.length > 0 && (
        <>
          <SectionHeading label="SELECTED WORK" title="In the frame." />
          <div className="projects-grid">
            {projects.map((project) => (
              <ProjectCard project={project} key={project.id} />
            ))}
          </div>
        </>
      )}
    </article>
  )
}

export function Updates() {
  const { content } = useSite()
  const [category, setCategory] = useState('all')
  const updates = content.updates
    .filter(
      (update) =>
        isPublic('updates', update) &&
        (category === 'all' || update.category === category),
    )
    .sort((first, second) => second.date.localeCompare(first.date))
  return (
    <>
      <PageHeading
        label="THE CINEPHILE JOURNAL"
        title={
          <>
            Between takes.
            <br />
            <em>Beyond the frame</em>
          </>
        }
      >
        Fresh perspectives, company news and stories from the collective.
      </PageHeading>
      <section className="container journal-section">
        <FilterBar
          items={[
            { id: 'all', name: 'All updates' },
            ...UPDATE_CATEGORIES.map((name) => ({ id: name, name })),
          ]}
          value={category}
          onChange={setCategory}
        />
        <div className="updates-grid">
          {updates.map((update) => (
            <UpdateCard key={update.id} update={update} />
          ))}
        </div>
        {!updates.length && (
          <EmptyState title="A little quiet between takes.">
            There are no published updates in this category yet.
          </EmptyState>
        )}
      </section>
      <ContactBand />
    </>
  )
}

export function UpdateDetail({ entry, preview = false }) {
  const { id } = useParams()
  const { content } = useSite()
  const update =
    entry ||
    content.updates.find((item) => item.id === id && isPublic('updates', item))
  if (!update) return <NotFound />
  return (
    <>
      <article className="container article-page">
        <Breadcrumb to="/updates">All updates</Breadcrumb>
        <div className="article-title">
          <div className="update-meta">
            <span>
              {update.category} {update.sample ? '/ Sample editorial' : ''}
              {preview && ' / PREVIEW'}
            </span>
            <time dateTime={update.date}>{formatDate(update.date)}</time>
          </div>
          <h1>{update.title}</h1>
          <p>{update.description}</p>
        </div>
        <img
          className="article-hero"
          src={safeUrl(update.image, true)}
          alt={update.title}
          width="1400"
          height="800"
        />
        <div className="article-copy">
          {(update.body || update.description)
            .split('\n')
            .filter(Boolean)
            .map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          <Video url={update.videoUrl} title={`${update.title} video`} />
          {safeUrl(update.externalUrl) && (
            <a
              className="arrow-link"
              href={safeUrl(update.externalUrl)}
              target="_blank"
              rel="noreferrer"
            >
              Related official link <ArrowUpRight size={18} />
            </a>
          )}
          <div className="article-end">
            <Aperture size={22} />
            <span>THE CINEPHILE JOURNAL</span>
          </div>
        </div>
      </article>
      {!preview && <ContactBand />}
    </>
  )
}

export function Contact() {
  const { content, addEnquiry } = useSite()
  const [params] = useSearchParams()
  const initialType =
    HOUSES.find((house) => house.id === params.get('type'))?.name ||
    'General Enquiry'
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const { settings } = content
  function submit(event) {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget))
    if (values.website) {
      setError('This enquiry could not be saved.')
      return
    }
    const enquiry = {
      name: values.name.trim(),
      email: values.email.trim(),
      type: values.type,
      message: values.message.trim(),
    }
    if (
      !enquiry.name ||
      !enquiry.message ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enquiry.email) ||
      !ENQUIRY_TYPES.includes(enquiry.type)
    ) {
      setError('Please complete all fields with a valid email address.')
      return
    }
    const result = addEnquiry(enquiry)
    setError(result)
    if (!result) setSuccess(true)
  }
  return (
    <>
      <PageHeading
        label="LET'S MAKE SOMETHING MATTER"
        title={
          <>
            Every good story
            <br />
            <em>starts with hello</em>
          </>
        }
      >
        A brief, a big idea, or the beginning of one. We'd love to hear it.
      </PageHeading>
      <section className="container contact-layout">
        <aside className="contact-info">
          <div className="contact-intro">
            <span className="eyebrow">FIND YOUR CREATIVE PEOPLE</span>
            <h2>
              Your next chapter.
              <br />
              Our first conversation.
            </h2>
            <p>
              Tell us what you have in mind. The right house is a conversation
              away.
            </p>
          </div>
          <div className="contact-detail">
            <Mail size={20} />
            <div>
              <span className="eyebrow">EMAIL</span>
              {settings.email ? (
                <a href={`mailto:${settings.email}`}>{settings.email}</a>
              ) : (
                <span>Official email to be announced</span>
              )}
            </div>
          </div>
          <div className="contact-detail">
            <Phone size={20} />
            <div>
              <span className="eyebrow">PHONE / WHATSAPP</span>
              {settings.phone ? (
                <a href={`tel:${settings.phone.replace(/[^+\d]/g, '')}`}>
                  {settings.phone}
                </a>
              ) : (
                <span>Official number to be announced</span>
              )}
              {settings.whatsapp && (
                <a
                  href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Chat on WhatsApp <ArrowUpRight size={14} />
                </a>
              )}
            </div>
          </div>
          {settings.address && (
            <div className="contact-detail">
              <MapPin size={20} />
              <div>
                <span className="eyebrow">OUR ADDRESS</span>
                <span className="preserve-lines">{settings.address}</span>
              </div>
            </div>
          )}
          <div className="contact-socials">
            <span className="eyebrow">STAY IN THE FRAME</span>
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
                      <Icon size={20} />
                    </a>
                  ),
              )}
            </div>
            {!['instagram', 'youtube', 'linkedin'].some((key) =>
              safeUrl(settings[key]),
            ) && <p>Official social channels coming soon.</p>}
          </div>
        </aside>
        <div className="contact-form-wrap">
          {success ? (
            <div className="contact-success" role="status">
              <span className="success-icon">
                <Check size={32} />
              </span>
              <span className="eyebrow">A CONVERSATION, STARTED</span>
              <h2>
                Your idea is
                <br />
                <em>in the notebook.</em>
              </h2>
              <p>
                Your demo enquiry was saved in this browser. No email was sent,
                and the Cinephile team has not received it.
              </p>
              <button
                className="button button-dark"
                onClick={() => setSuccess(false)}
              >
                Write another enquiry <ArrowUpRight size={17} />
              </button>
            </div>
          ) : (
            <form className="contact-form" onSubmit={submit}>
              <div className="form-title">
                <h2>What's on your mind?</h2>
                <span>01 / SAY HELLO</span>
              </div>
              <div className="form-row">
                <label>
                  Your name <span>*</span>
                  <input
                    name="name"
                    autoComplete="name"
                    placeholder="The name behind the idea"
                    required
                    maxLength={100}
                  />
                </label>
                <label>
                  Email address <span>*</span>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    required
                    maxLength={180}
                  />
                </label>
              </div>
              <label>
                What brings you here? <span>*</span>
                <select name="type" defaultValue={initialType}>
                  {ENQUIRY_TYPES.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>
              <label>
                A little about your idea <span>*</span>
                <textarea
                  name="message"
                  placeholder="The story, the ambition, the what if..."
                  rows={5}
                  minLength={10}
                  maxLength={5000}
                  required
                />
              </label>
              <div className="honeypot" aria-hidden="true">
                <label>
                  Website
                  <input name="website" tabIndex={-1} autoComplete="off" />
                </label>
              </div>
              <label className="checkbox-label">
                <input type="checkbox" name="consent" required />
                <span>
                  I agree to the <Link to="/privacy">privacy policy</Link> and
                  local storage of this demo enquiry.
                </span>
              </label>
              <div className="demo-note">
                Demo form: saved only in this browser, not delivered. Please use
                sample details.
              </div>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="button button-dark submit-button"
              >
                Start the conversation <Send size={17} />
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  )
}

export function Privacy() {
  return (
    <>
      <PageHeading
        label="THE SMALL PRINT, CLEARLY"
        title={
          <>
            Privacy &<br />
            <em>permission</em>
          </>
        }
      >
        Respect for people. Respect for the work.
      </PageHeading>
      <article className="container policy-page">
        <p className="policy-date">
          Website prototype policy / Last updated 18 October 2026
        </p>
        <h2>This is a local website demo</h2>
        <p>
          This prototype has no production backend, live email delivery or
          secure administrator authentication. Its example login is public and
          must not protect real personal information. Please use sample
          information only.
        </p>
        <h2>What is stored</h2>
        <p>
          Projects, updates, approved profiles, contact settings and demo
          enquiries are stored in localStorage in this browser. The demo
          administrator session is stored in sessionStorage for this browser
          tab. Enquiries contain the name, email, enquiry type, message and
          submission time you enter. They are not sent to Cinephile, and are not
          shared between devices.
        </p>
        <h2>Your choices</h2>
        <p>
          To remove all local demo data, clear this site's browser storage. The
          demo admin can also delete individual enquiries and content records.
          Exported backups contain local content and enquiries, so they must be
          handled carefully and deleted when no longer needed.
        </p>
        <h2>Images, video and third parties</h2>
        <p>
          Demo project photography is sourced from Unsplash under the Unsplash
          license and downloaded with the site. Font files are self-hosted.
          Sample projects are fictional concepts, not client endorsements,
          released productions or claims of representation. Replace all sample
          content with approved work before publishing.
        </p>
        <p>
          The Tamil-cinema tribute uses locally hosted Wikimedia Commons
          portraits under the individual licenses recorded in the{' '}
          <Link to="/#portrait-credits">portrait credits and licenses</Link>.
          Photos are resized, cropped and shown in monochrome, with photo
          adaptations retaining their respective licenses. This is editorial
          appreciation, not a claim that these artists endorse Cinephile, are
          clients, or are represented by the collective.
        </p>
        <p>
          Admin-added remote images contact their image host when displayed.
          External social and project links follow the destination site's
          policy. Embedded YouTube videos load only after you choose to load
          them, using YouTube's privacy-enhanced domain; Google may still
          receive technical information such as your IP address. Direct video
          links contact their host when played.
        </p>
        <h2>Profile publication permission</h2>
        <p>
          Public profiles require an explicit listing approval, media approval,
          recorded consent date and permission reference. A profile described as
          represented talent also requires representation approval. The talent
          directory starts empty and is separate from the editorial cinema
          tribute. Permissions should be reviewed and withdrawn promptly when
          requested.
        </p>
        <h2>Before a public launch</h2>
        <p>
          Cinephile must confirm its legal business identity, official contact
          details, privacy contact, retention periods, lawful basis and
          applicable privacy rights. The deployed service also needs server-side
          authentication, access controls, form spam protection, secure HTTPS
          and scheduled encrypted backups. This prototype policy is not a
          substitute for that final privacy notice.
        </p>
        <ArrowLink to="/contact">Contact the collective</ArrowLink>
      </article>
    </>
  )
}

export function NotFound() {
  return (
    <section className="container not-found">
      <span className="eyebrow">404 / A MISSING FRAME</span>
      <h1>
        This scene
        <br />
        <em>isn't in the film.</em>
      </h1>
      <p>
        This page may be unpublished, moved, or still on the cutting-room floor.
      </p>
      <Link to="/" className="button button-dark">
        Back to the opening scene <ArrowRight size={17} />
      </Link>
    </section>
  )
}
