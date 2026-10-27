import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clapperboard,
  Download,
  Eye,
  EyeOff,
  FileText,
  Inbox,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Plus,
  Save,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react'
import { HOUSES, IMAGES, RELATIONSHIPS, UPDATE_CATEGORIES } from './data.js'
import { useSite } from './lib/site-context.js'
import {
  DEMO_ADMIN,
  entryError,
  isPublic,
  safeUrl,
  settingsError,
  validateBackup,
} from './lib/content.js'
import { EmptyState, Modal, SuccessMessage } from './components.jsx'
import { ProfileDetail, ProjectDetail, UpdateDetail } from './pages.jsx'

const TABS = [
  { id: 'overview', name: 'Overview', icon: LayoutDashboard },
  { id: 'projects', name: 'Projects', icon: Clapperboard },
  { id: 'updates', name: 'Updates', icon: FileText },
  { id: 'profiles', name: 'Profiles', icon: Users },
  { id: 'enquiries', name: 'Enquiries', icon: Inbox },
  { id: 'settings', name: 'Settings', icon: Settings2 },
]

function newEntry(collection) {
  const entry = {
    id: crypto.randomUUID(),
    title: '',
    description: '',
    body: '',
    image: IMAGES.film,
    status: 'draft',
    mediaApproved: false,
    sample: false,
  }
  if (collection === 'projects')
    return {
      ...entry,
      category: 'creative',
      year: String(new Date().getFullYear()),
      type: '',
      role: '',
      credits: '',
      gallery: [],
      videoUrl: '',
      externalUrl: '',
      featured: false,
    }
  if (collection === 'updates')
    return {
      ...entry,
      category: 'Studio notes',
      date: new Date().toISOString().slice(0, 10),
      videoUrl: '',
      externalUrl: '',
    }
  return {
    ...entry,
    relationship: 'Collaborator',
    role: '',
    socialUrl: '',
    projectIds: [],
    listingApproved: false,
    representationApproved: false,
    consentDate: '',
    permissionNote: '',
  }
}

function Field({
  label,
  name,
  value,
  onChange,
  multiline = false,
  children,
  ...props
}) {
  const Control = multiline ? 'textarea' : 'input'
  return (
    <label className="editor-field">
      {label}
      {children || (
        <Control
          name={name}
          value={value ?? ''}
          onChange={(event) => onChange(name, event.target.value)}
          {...props}
        />
      )}
    </label>
  )
}

export function Login() {
  const { admin, login } = useSite()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  if (admin) return <Navigate to="/admin" replace />
  function submit(event) {
    event.preventDefault()
    const result = login(email, password)
    setError(result)
    if (!result) navigate('/admin', { replace: true })
  }
  return (
    <section className="login-page container">
      <div className="login-story">
        <span className="eyebrow">
          <span className="small-line" />
          BEHIND THE SCENES
        </span>
        <h1>
          The story
          <br />
          <em>starts here.</em>
        </h1>
        <p>
          A little space for the people
          <br />
          who bring Cinephile to life.
        </p>
        <img
          src={IMAGES.film}
          alt="Cinema film equipment"
          width="600"
          height="340"
        />
      </div>
      <div className="login-panel">
        <div className="login-icon">
          <KeyRound size={24} strokeWidth={1.5} />
        </div>
        <span className="eyebrow">CINEPHILE / TEAM ACCESS</span>
        <h2>Welcome to the studio.</h2>
        <p>Sign in with the example administrator account.</p>
        <form onSubmit={submit} className="login-form">
          <label>
            Email address
            <input
              type="email"
              name="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Your admin email"
            />
          </label>
          <label>
            Password
            <div className="password-field">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Your password"
              />
              <button
                type="button"
                className="icon-button"
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="button button-dark">
            Enter the studio <ArrowRight size={17} />
          </button>
        </form>
        <div className="demo-credentials">
          <div>
            <ShieldCheck size={16} />
            <span>EXAMPLE ADMIN ACCOUNT</span>
          </div>
          <dl>
            <dt>Email</dt>
            <dd>{DEMO_ADMIN.email}</dd>
            <dt>Password</dt>
            <dd>{DEMO_ADMIN.password}</dd>
          </dl>
          <button
            type="button"
            className="arrow-link"
            onClick={() => {
              setEmail(DEMO_ADMIN.email)
              setPassword(DEMO_ADMIN.password)
              setError('')
            }}
          >
            Use demo credentials <ArrowUpRight size={16} />
          </button>
        </div>
        <p className="auth-disclaimer">
          Placeholder authentication only. This is not secure access control.
          Content stays in this browser; do not use real passwords or private
          information.
        </p>
      </div>
    </section>
  )
}

function ContentEditor({ collection, initial, onClose, onPreview, onSaved }) {
  const { content, saveEntry } = useSite()
  const [draft, setDraft] = useState(initial)
  const [error, setError] = useState('')
  const singular =
    collection === 'projects'
      ? 'project'
      : collection === 'updates'
        ? 'update'
        : 'profile'
  const isProfile = collection === 'profiles'
  function setField(name, value) {
    setDraft((current) => ({ ...current, [name]: value }))
  }
  function setApproval(name, value) {
    setDraft((current) => ({
      ...current,
      [name]: value,
      status: value ? current.status : 'draft',
    }))
  }
  function submit(event) {
    event.preventDefault()
    const cleaned = {
      ...draft,
      title: draft.title.trim(),
      description: draft.description.trim(),
      image: draft.image.trim(),
      updatedAt: new Date().toISOString(),
    }
    const result = saveEntry(collection, cleaned)
    setError(result)
    if (!result)
      onSaved(
        `${singular[0].toUpperCase() + singular.slice(1)} saved as ${cleaned.status}.`,
      )
  }
  return (
    <Modal
      title={`${content[collection].some((entry) => entry.id === initial.id) ? 'Edit' : 'New'} ${singular}`}
      onClose={onClose}
      className="editor-modal"
    >
      <form onSubmit={submit} className="content-editor">
        <div className="form-row">
          <Field
            label={isProfile ? 'Public name *' : 'Title *'}
            name="title"
            value={draft.title}
            onChange={setField}
            required
            maxLength={120}
          />
          <Field label="Visibility">
            <select
              aria-label="Visibility"
              value={draft.status}
              onChange={(event) => setField('status', event.target.value)}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </Field>
        </div>
        {collection === 'projects' && (
          <>
            <div className="form-row">
              <Field label="House">
                <select
                  aria-label="House"
                  value={draft.category}
                  onChange={(event) => setField('category', event.target.value)}
                >
                  {HOUSES.map((house) => (
                    <option key={house.id} value={house.id}>
                      {house.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Year"
                name="year"
                value={draft.year}
                onChange={setField}
                maxLength={4}
                pattern="[0-9]{4}"
              />
            </div>
            <div className="form-row">
              <Field
                label="Project format"
                name="type"
                value={draft.type}
                onChange={setField}
                placeholder="Short film, campaign, visual identity..."
                maxLength={100}
              />
              <Field
                label="Cinephile's role"
                name="role"
                value={draft.role}
                onChange={setField}
                maxLength={200}
              />
            </div>
          </>
        )}
        {collection === 'updates' && (
          <div className="form-row">
            <Field label="Category">
              <select
                aria-label="Category"
                value={draft.category}
                onChange={(event) => setField('category', event.target.value)}
              >
                {UPDATE_CATEGORIES.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </Field>
            <Field
              label="Publication date *"
              name="date"
              value={draft.date}
              onChange={setField}
              type="date"
              required
            />
          </div>
        )}
        {isProfile && (
          <div className="form-row">
            <Field label="Relationship to Cinephile">
              <select
                aria-label="Relationship to Cinephile"
                value={draft.relationship}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    relationship: event.target.value,
                    status: 'draft',
                  })
                }
              >
                {RELATIONSHIPS.map((relationship) => (
                  <option key={relationship}>{relationship}</option>
                ))}
              </select>
            </Field>
            <Field
              label="Role or discipline"
              name="role"
              value={draft.role}
              onChange={setField}
              placeholder="Actor, filmmaker, creator..."
              maxLength={100}
            />
          </div>
        )}
        <Field
          label={isProfile ? 'Short biography *' : 'Short description *'}
          name="description"
          value={draft.description}
          onChange={setField}
          multiline
          rows={3}
          required
          maxLength={600}
        />
        <Field
          label={isProfile ? 'Full biography' : 'Full story'}
          name="body"
          value={draft.body}
          onChange={setField}
          multiline
          rows={6}
          maxLength={20000}
        />
        <Field
          label="Image URL *"
          name="image"
          value={draft.image}
          onChange={setField}
          required
          placeholder="https://... or /images/film.jpg"
          maxLength={2000}
        />
        <div className="media-picker">
          <span className="eyebrow">DEMO PHOTOGRAPHY</span>
          <div>
            {Object.entries(IMAGES).map(([key, url]) => (
              <button
                type="button"
                key={key}
                aria-label={`Use ${key} image`}
                title={`Use ${key} image`}
                aria-pressed={draft.image === url}
                onClick={() => setField('image', url)}
              >
                <img src={url} alt="" width="80" height="60" />
                {draft.image === url && <Check size={15} />}
              </button>
            ))}
          </div>
        </div>
        {collection === 'projects' && (
          <>
            <Field
              label="Gallery images (one URL per line)"
              name="gallery"
              value={draft.gallery?.join('\n') || ''}
              onChange={(_, value) => setField('gallery', value.split('\n'))}
              multiline
              rows={3}
              onBlur={() =>
                setField(
                  'gallery',
                  draft.gallery.map((value) => value.trim()).filter(Boolean),
                )
              }
            />
            <Field
              label="Credits"
              name="credits"
              value={draft.credits}
              onChange={setField}
              multiline
              rows={3}
              maxLength={4000}
            />
          </>
        )}
        {!isProfile && (
          <div className="form-row">
            <Field
              label="Video URL (optional)"
              name="videoUrl"
              type="url"
              value={draft.videoUrl}
              onChange={setField}
              placeholder="HTTPS YouTube or video link"
              maxLength={2000}
            />
            <Field
              label="Official project or related link"
              name="externalUrl"
              type="url"
              value={draft.externalUrl}
              onChange={setField}
              placeholder="https://..."
              maxLength={2000}
            />
          </div>
        )}
        {isProfile && (
          <>
            <Field
              label="Official social profile (optional)"
              name="socialUrl"
              type="url"
              value={draft.socialUrl}
              onChange={setField}
              placeholder="https://..."
              maxLength={2000}
            />
            <fieldset className="project-selection">
              <legend>Selected projects</legend>
              {content.projects.map((project) => (
                <label className="checkbox-label" key={project.id}>
                  <input
                    type="checkbox"
                    checked={draft.projectIds?.includes(project.id) || false}
                    onChange={(event) =>
                      setField(
                        'projectIds',
                        event.target.checked
                          ? [...(draft.projectIds || []), project.id]
                          : draft.projectIds.filter((id) => id !== project.id),
                      )
                    }
                  />
                  <span>{project.title}</span>
                </label>
              ))}
            </fieldset>
          </>
        )}
        <fieldset className="permission-fields">
          <legend>
            <ShieldCheck size={16} />
            {isProfile ? 'Publication permissions' : 'Media & publication'}
          </legend>
          {isProfile && (
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={draft.listingApproved || false}
                onChange={(event) =>
                  setApproval('listingApproved', event.target.checked)
                }
              />
              <span>
                Permission to publicly list this person has been obtained.
              </span>
            </label>
          )}
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={draft.mediaApproved || false}
              onChange={(event) =>
                setApproval('mediaApproved', event.target.checked)
              }
            />
            <span>
              {isProfile
                ? 'Permission to publish the photo, biography and linked media has been obtained.'
                : 'Cinephile has the rights or permission to publish all included media.'}
            </span>
          </label>
          {isProfile && draft.relationship === 'Represented talent' && (
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={draft.representationApproved || false}
                onChange={(event) =>
                  setApproval('representationApproved', event.target.checked)
                }
              />
              <span>
                There is explicit permission to claim representation by
                Cinephile.
              </span>
            </label>
          )}
          {isProfile && (
            <div className="form-row">
              <Field
                label="Consent date"
                name="consentDate"
                type="date"
                value={draft.consentDate}
                onChange={setField}
              />
              <Field
                label="Permission reference"
                name="permissionNote"
                value={draft.permissionNote}
                onChange={setField}
                placeholder="Approval reference, not private documents"
                maxLength={500}
              />
            </div>
          )}
          {isProfile && (
            <p>
              Profiles cannot be published without recorded approvals.
              Withdrawing an approval returns the profile to draft.
            </p>
          )}
          {!isProfile && (
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={draft.sample || false}
                onChange={(event) => setField('sample', event.target.checked)}
              />
              <span>Label this as a sample or fictional concept.</span>
            </label>
          )}
          {collection === 'projects' && (
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={draft.featured || false}
                onChange={(event) => setField('featured', event.target.checked)}
              />
              <span>Feature on the home page.</span>
            </label>
          )}
        </fieldset>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="editor-actions">
          <button
            type="button"
            className="button button-outline"
            onClick={() =>
              onPreview({
                ...draft,
                title: draft.title || 'A story in progress',
                description:
                  draft.description || 'The next chapter is taking shape.',
              })
            }
          >
            <Eye size={16} />
            Preview
          </button>
          <div>
            <button
              type="button"
              className="button button-outline"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="button button-dark">
              <Save size={16} />
              Save changes
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

function SettingsForm({ onSaved }) {
  const { content, saveSettings } = useSite()
  const [settings, setSettings] = useState(content.settings)
  const [error, setError] = useState('')
  function setField(name, value) {
    setSettings((current) => ({ ...current, [name]: value }))
  }
  function submit(event) {
    event.preventDefault()
    const cleaned = Object.fromEntries(
      Object.entries(settings).map(([key, value]) => [key, value.trim()]),
    )
    const result = settingsError(cleaned) || saveSettings(cleaned)
    setError(result)
    if (!result) onSaved('Official contact details saved in this browser.')
  }
  return (
    <form className="settings-form" onSubmit={submit}>
      <div className="admin-section-title">
        <h3>Official contact details</h3>
        <p>
          Leave unverified details blank. Only publish an address intended for
          public use.
        </p>
      </div>
      <Field
        label="Official email"
        name="email"
        type="email"
        value={settings.email}
        onChange={setField}
        maxLength={180}
      />
      <div className="form-row">
        <Field
          label="Public phone number"
          name="phone"
          type="tel"
          value={settings.phone}
          onChange={setField}
          maxLength={25}
        />
        <Field
          label="WhatsApp (with country code)"
          name="whatsapp"
          type="tel"
          value={settings.whatsapp}
          onChange={setField}
          maxLength={25}
        />
      </div>
      <Field
        label="Public office address (optional)"
        name="address"
        value={settings.address}
        onChange={setField}
        multiline
        rows={3}
        maxLength={600}
      />
      <Field
        label="Instagram URL"
        name="instagram"
        type="url"
        value={settings.instagram}
        onChange={setField}
      />
      <Field
        label="YouTube URL"
        name="youtube"
        type="url"
        value={settings.youtube}
        onChange={setField}
      />
      <Field
        label="LinkedIn URL"
        name="linkedin"
        type="url"
        value={settings.linkedin}
        onChange={setField}
      />
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <button type="submit" className="button button-dark">
        <Save size={16} />
        Save contact details
      </button>
    </form>
  )
}

function ContentTable({
  collection,
  entries,
  onEdit,
  onPreview,
  onDelete,
  onPublish,
}) {
  if (!entries.length)
    return (
      <EmptyState title="A fresh page.">
        No matching records. Start a new story or adjust your search.
      </EmptyState>
    )
  return (
    <div className="table-scroll">
      <table className="content-table">
        <thead>
          <tr>
            <th>{collection === 'profiles' ? 'Name' : 'Title'}</th>
            <th>{collection === 'profiles' ? 'Relationship' : 'Category'}</th>
            <th>Status</th>
            <th>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td>
                <div className="table-title">
                  <img
                    src={safeUrl(entry.image, true)}
                    alt=""
                    width="52"
                    height="52"
                  />
                  <div>
                    <button
                      className="table-entry-link"
                      onClick={() => onEdit(entry)}
                    >
                      {entry.title}
                    </button>
                    {entry.sample && <span>Sample content</span>}
                  </div>
                </div>
              </td>
              <td>
                {collection === 'projects'
                  ? HOUSES.find((house) => house.id === entry.category)?.short
                  : collection === 'profiles'
                    ? entry.relationship
                    : entry.category}
              </td>
              <td>
                <span
                  className={`status-badge ${isPublic(collection, entry) ? 'status-published' : ''}`}
                >
                  {entry.status}
                </span>
              </td>
              <td>
                <div className="table-actions">
                  <button
                    className="icon-button"
                    title={`Preview ${entry.title}`}
                    aria-label={`Preview ${entry.title}`}
                    onClick={() => onPreview(entry)}
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    className="icon-button"
                    title={`${entry.status === 'published' ? 'Unpublish' : 'Publish'} ${entry.title}`}
                    aria-label={`${entry.status === 'published' ? 'Unpublish' : 'Publish'} ${entry.title}`}
                    onClick={() => onPublish(entry)}
                  >
                    {entry.status === 'published' ? (
                      <EyeOff size={16} />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                  <button
                    className="icon-button delete-action"
                    title={`Delete ${entry.title}`}
                    aria-label={`Delete ${entry.title}`}
                    onClick={() => onDelete(entry)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Admin() {
  const { content, admin, logout, saveEntry, removeEntry, restoreContent } =
    useSite()
  const [tab, setTab] = useState('overview')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [editor, setEditor] = useState(null)
  const [preview, setPreview] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [pendingImport, setPendingImport] = useState(null)
  const [selectedEnquiry, setSelectedEnquiry] = useState(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  if (!admin) return <Navigate to="/login" replace />

  const isCollection = ['projects', 'updates', 'profiles'].includes(tab)
  const entries = isCollection
    ? content[tab].filter(
        (entry) =>
          (status === 'all' || entry.status === status) &&
          `${entry.title} ${entry.description}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      )
    : []

  function changeTab(value, nextStatus = 'all') {
    setTab(value)
    setQuery('')
    setStatus(nextStatus)
    setNotice('')
    setError('')
  }
  function saved(message) {
    setNotice(message)
    setError('')
    setEditor(null)
  }
  function publish(entry) {
    const next = {
      ...entry,
      status: entry.status === 'published' ? 'draft' : 'published',
    }
    const result = entryError(tab, next) || saveEntry(tab, next)
    setError(result)
    setNotice(result ? '' : `"${entry.title}" is now ${next.status}.`)
  }
  function confirmDelete() {
    const result = removeEntry(pendingDelete.collection, pendingDelete.entry.id)
    setError(result)
    if (!result) {
      setNotice('Record deleted from this browser.')
      setPendingDelete(null)
      setSelectedEnquiry(null)
    }
  }
  function exportBackup() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(content, null, 2)], {
        type: 'application/json',
      }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `cinephile-backup-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setNotice(
      'Backup exported. It includes enquiries and permission references; keep it private.',
    )
  }
  async function importBackup(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > 4_000_000) {
      setError('This backup is too large. The maximum is 4 MB.')
      return
    }
    try {
      const value = JSON.parse(await file.text())
      if (!validateBackup(value)) throw new Error('Invalid backup')
      setPendingImport(value)
      setError('')
    } catch {
      setError('This is not a valid Cinephile backup. No content was changed.')
    }
  }
  function confirmImport() {
    const result = restoreContent(pendingImport)
    setError(result)
    if (!result) {
      setPendingImport(null)
      setNotice('Backup restored in this browser.')
    }
  }

  return (
    <section className="admin-studio container">
      <div className="admin-heading">
        <div>
          <span className="eyebrow">CINEPHILE / THE WORKSPACE</span>
          <h1>
            Behind the scenes<span className="accent">.</span>
          </h1>
        </div>
        <button className="button button-outline" onClick={exportBackup}>
          <Download size={16} />
          Export backup
        </button>
      </div>
      <div className="admin-demo-banner">
        <ShieldCheck size={18} />
        <p>
          <strong>Demo admin.</strong> Browser-local content and placeholder
          authentication. Not secure or shared across devices. Use sample data
          only.
        </p>
      </div>
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <nav aria-label="Admin sections">
            {TABS.map(({ id, name, icon: Icon }) => (
              <button
                key={id}
                className={tab === id ? 'selected' : ''}
                aria-current={tab === id ? 'page' : undefined}
                onClick={() => changeTab(id)}
              >
                <Icon size={17} />
                <span>{name}</span>
                {id === 'enquiries' && content.enquiries.length > 0 && (
                  <small>{content.enquiries.length}</small>
                )}
              </button>
            ))}
          </nav>
          <div className="admin-account">
            <span className="account-avatar">C</span>
            <div>
              <strong>Demo administrator</strong>
              <span>{DEMO_ADMIN.email}</span>
            </div>
          </div>
          <button className="logout-button" onClick={logout}>
            <LogOut size={15} />
            Sign out
          </button>
          <Link className="admin-public-link" to="/">
            View public website <ArrowUpRight size={14} />
          </Link>
        </aside>
        <div className="admin-main admin-panel" key={tab}>
          {notice && (
            <div className="admin-notice">
              <SuccessMessage>{notice}</SuccessMessage>
              <button
                className="icon-button"
                onClick={() => setNotice('')}
                title="Dismiss notification"
                aria-label="Dismiss notification"
              >
                <X size={15} />
              </button>
            </div>
          )}
          {error && (
            <p className="admin-error" role="alert">
              {error}
            </p>
          )}
          {tab === 'overview' && (
            <>
              <div className="admin-section-title">
                <h2>The bigger picture.</h2>
                <p>Every story, every voice, all in one place.</p>
              </div>
              <div className="admin-stats">
                {[
                  ['projects', 'Projects', Clapperboard],
                  ['updates', 'Updates', FileText],
                  ['profiles', 'Public profiles', Users],
                  ['enquiries', 'Enquiries', Inbox],
                ].map(([key, label, Icon]) => (
                  <button key={key} onClick={() => changeTab(key)}>
                    <div>
                      <span>{label}</span>
                      <Icon size={18} />
                    </div>
                    <strong>
                      {String(
                        key === 'profiles'
                          ? content.profiles.filter((entry) =>
                              isPublic('profiles', entry),
                            ).length
                          : content[key].length,
                      ).padStart(2, '0')}
                    </strong>
                    <span>
                      {key === 'enquiries'
                        ? 'Saved locally'
                        : `${content[key].filter((entry) => entry.status === 'draft').length} in draft`}{' '}
                      <ArrowUpRight size={13} />
                    </span>
                  </button>
                ))}
              </div>
              <div className="admin-workbench">
                <section
                  className="admin-quick-create"
                  aria-labelledby="admin-quick-create-title"
                >
                  <div className="admin-workbench-heading">
                    <h3 id="admin-quick-create-title">Start something new</h3>
                    <p>Jump straight into a fresh draft.</p>
                  </div>
                  <div className="admin-quick-actions">
                    {[
                      {
                        collection: 'projects',
                        label: 'Project',
                        description: 'Film and campaign work',
                        icon: Clapperboard,
                      },
                      {
                        collection: 'updates',
                        label: 'Update',
                        description: 'Notes from the studio',
                        icon: FileText,
                      },
                      {
                        collection: 'profiles',
                        label: 'Profile',
                        description: 'People in the collective',
                        icon: Users,
                      },
                    ].map(({ collection, label, description, icon: Icon }) => (
                      <button
                        key={collection}
                        aria-label={`Create new ${label.toLowerCase()}`}
                        onClick={() =>
                          setEditor({ collection, entry: newEntry(collection) })
                        }
                      >
                        <Icon size={17} />
                        <span>
                          <strong>New {label}</strong>
                          <small>{description}</small>
                        </span>
                        <ArrowUpRight size={14} />
                      </button>
                    ))}
                  </div>
                </section>
                <section
                  className="admin-draft-review"
                  aria-labelledby="admin-draft-review-title"
                >
                  <div className="admin-workbench-heading">
                    <h3 id="admin-draft-review-title">Drafts to review</h3>
                    <p>Open a collection with drafts already filtered.</p>
                  </div>
                  {[
                    ['projects', 'Projects', Clapperboard],
                    ['updates', 'Updates', FileText],
                    ['profiles', 'Profiles', Users],
                  ].map(([collection, label, Icon]) => (
                    <button
                      key={collection}
                      aria-label={`Review ${label} drafts`}
                      onClick={() => changeTab(collection, 'draft')}
                    >
                      <span>
                        <Icon size={15} />
                        <strong>{label}</strong>
                      </span>
                      <span className="admin-draft-count">
                        {
                          content[collection].filter(
                            (entry) => entry.status === 'draft',
                          ).length
                        }
                      </span>
                      <ArrowRight size={14} />
                    </button>
                  ))}
                </section>
              </div>
              <div className="admin-overview-work">
                <div className="admin-section-title">
                  <h3>Your projects</h3>
                  <button
                    className="arrow-link"
                    onClick={() => changeTab('projects')}
                  >
                    Manage projects <ArrowUpRight size={15} />
                  </button>
                </div>
                <ContentTable
                  collection="projects"
                  entries={content.projects.slice(0, 4)}
                  onEdit={(entry) =>
                    setEditor({ collection: 'projects', entry })
                  }
                  onPreview={(entry) =>
                    setPreview({ collection: 'projects', entry })
                  }
                  onDelete={(entry) =>
                    setPendingDelete({ collection: 'projects', entry })
                  }
                  onPublish={(entry) => {
                    const next = {
                      ...entry,
                      status:
                        entry.status === 'published' ? 'draft' : 'published',
                    }
                    const result = saveEntry('projects', next)
                    setError(result)
                    setNotice(
                      result ? '' : `"${entry.title}" is now ${next.status}.`,
                    )
                  }}
                />
              </div>
              <div className="admin-launch-note">
                <ShieldCheck size={25} />
                <div>
                  <h3>From prototype to premiere.</h3>
                  <p>
                    Before launch: replace concept content, connect a secure
                    backend, verify contact details, review media permissions,
                    enable spam protection and schedule encrypted backups.
                  </p>
                </div>
              </div>
            </>
          )}
          {isCollection && (
            <>
              <div className="admin-section-title admin-content-title">
                <div>
                  <h2>{TABS.find((item) => item.id === tab).name}</h2>
                  <p>
                    {tab === 'profiles'
                      ? 'Publish only people with recorded permission.'
                      : 'Your next story starts with a draft.'}
                  </p>
                </div>
                <button
                  className="button button-dark"
                  onClick={() =>
                    setEditor({ collection: tab, entry: newEntry(tab) })
                  }
                >
                  <Plus size={16} />
                  New{' '}
                  {tab === 'projects'
                    ? 'project'
                    : tab === 'updates'
                      ? 'update'
                      : 'profile'}
                </button>
              </div>
              <div className="admin-toolbar">
                <label className="search-field">
                  <Search size={16} />
                  <input
                    aria-label="Search admin content"
                    placeholder="Search titles and descriptions"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </label>
                <select
                  aria-label="Filter by status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  <option value="all">All statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Drafts</option>
                </select>
                <span>{entries.length} records</span>
              </div>
              <ContentTable
                collection={tab}
                entries={entries}
                onEdit={(entry) => setEditor({ collection: tab, entry })}
                onPreview={(entry) => setPreview({ collection: tab, entry })}
                onDelete={(entry) =>
                  setPendingDelete({ collection: tab, entry })
                }
                onPublish={publish}
              />
            </>
          )}
          {tab === 'enquiries' && (
            <>
              <div className="admin-section-title">
                <h2>The conversation starts here.</h2>
                <p>
                  Demo submissions saved only in this browser. No email has been
                  sent.
                </p>
              </div>
              {content.enquiries.length ? (
                <div className="enquiry-list">
                  {content.enquiries.map((enquiry) => (
                    <button
                      key={enquiry.id}
                      className="enquiry-row"
                      onClick={() => setSelectedEnquiry(enquiry)}
                    >
                      <span className="enquiry-initial">
                        {enquiry.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span>
                        <strong>{enquiry.name}</strong>
                        <span>{enquiry.type}</span>
                      </span>
                      <time dateTime={enquiry.date}>
                        {new Date(enquiry.date).toLocaleDateString('en', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </time>
                      <ArrowUpRight size={18} />
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState title="An open door.">
                  No demo enquiries yet.
                </EmptyState>
              )}
            </>
          )}
          {tab === 'settings' && (
            <>
              <SettingsForm
                key={JSON.stringify(content.settings)}
                onSaved={saved}
              />
              <div className="backup-panel">
                <div className="admin-section-title">
                  <h3>Content backups</h3>
                  <p>
                    Export regularly. Backups include enquiries and permission
                    references. Automatic server backups require a production
                    backend.
                  </p>
                </div>
                <div className="backup-actions">
                  <button
                    className="button button-outline"
                    onClick={exportBackup}
                  >
                    <Download size={16} />
                    Export backup
                  </button>
                  <label className="button button-outline import-button">
                    <Upload size={16} />
                    Restore backup
                    <input
                      type="file"
                      accept=".json,application/json"
                      aria-label="Restore backup"
                      onChange={importBackup}
                    />
                  </label>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {editor && (
        <ContentEditor
          collection={editor.collection}
          initial={editor.entry}
          onClose={() => setEditor(null)}
          onSaved={saved}
          onPreview={(entry) =>
            setPreview({ collection: editor.collection, entry })
          }
        />
      )}
      {preview && (
        <Modal
          title="Content preview"
          className="preview-modal"
          onClose={() => setPreview(null)}
        >
          <div className="preview-content">
            {preview.collection === 'projects' ? (
              <ProjectDetail entry={preview.entry} preview />
            ) : preview.collection === 'updates' ? (
              <UpdateDetail entry={preview.entry} preview />
            ) : (
              <ProfileDetail entry={preview.entry} preview />
            )}
          </div>
        </Modal>
      )}
      {pendingDelete && (
        <Modal
          title="Delete this record?"
          onClose={() => setPendingDelete(null)}
          className="confirm-modal"
        >
          <p>
            "{pendingDelete.entry.title || pendingDelete.entry.name}" will be
            removed from this browser. This cannot be undone without a backup.
          </p>
          <div className="confirmation-actions">
            <button
              className="button button-outline"
              onClick={() => setPendingDelete(null)}
            >
              Keep record
            </button>
            <button className="button button-danger" onClick={confirmDelete}>
              <Trash2 size={16} />
              Delete record
            </button>
          </div>
        </Modal>
      )}
      {pendingImport && (
        <Modal
          title="Restore this backup?"
          onClose={() => setPendingImport(null)}
          className="confirm-modal"
        >
          <p>
            This will replace all projects, profiles, updates, enquiries and
            settings in this browser. Export the current content first if you
            need to keep it.
          </p>
          <div className="confirmation-actions">
            <button
              className="button button-outline"
              onClick={() => setPendingImport(null)}
            >
              Cancel
            </button>
            <button className="button button-dark" onClick={confirmImport}>
              <Upload size={16} />
              Replace and restore
            </button>
          </div>
        </Modal>
      )}
      {selectedEnquiry && (
        <Modal
          title="Enquiry details"
          onClose={() => setSelectedEnquiry(null)}
          className="enquiry-modal"
        >
          <span className="eyebrow">{selectedEnquiry.type}</span>
          <h3>{selectedEnquiry.name}</h3>
          <p className="enquiry-email">{selectedEnquiry.email}</p>
          <p className="enquiry-message preserve-lines">
            {selectedEnquiry.message}
          </p>
          <p className="demo-note">
            Demo enquiry. This message has not been delivered outside this
            browser.
          </p>
          <div className="confirmation-actions">
            <button
              className="button button-outline"
              onClick={() => setSelectedEnquiry(null)}
            >
              Close
            </button>
            <button
              className="button button-danger"
              onClick={() =>
                setPendingDelete({
                  collection: 'enquiries',
                  entry: selectedEnquiry,
                })
              }
            >
              <Trash2 size={16} />
              Delete enquiry
            </button>
          </div>
        </Modal>
      )}
    </section>
  )
}
