import assert from 'node:assert/strict'
import test from 'node:test'
import { INITIAL_CONTENT } from '../src/data.js'
import {
  authenticate,
  DEMO_ADMIN,
  entryError,
  formatDate,
  isPublic,
  loadContent,
  profileApproved,
  safeUrl,
  settingsError,
  validDate,
  validateBackup,
  videoEmbed,
} from '../src/lib/content.js'

const approvedProfile = {
  id: 'approved-person',
  title: 'Sample Person',
  description: 'A fictional profile for testing.',
  image: '/images/film.jpg',
  relationship: 'Represented talent',
  status: 'published',
  listingApproved: true,
  mediaApproved: true,
  representationApproved: true,
  consentDate: '2026-10-18',
  permissionNote: 'Test approval reference',
}

test('only the exact demo account and password are accepted', () => {
  assert.equal(authenticate(DEMO_ADMIN.email, DEMO_ADMIN.password), true)
  assert.equal(
    authenticate(' ADMIN@CINEPHILE.DEMO ', DEMO_ADMIN.password),
    true,
  )
  assert.equal(authenticate('other@cinephile.demo', DEMO_ADMIN.password), false)
  assert.equal(authenticate(DEMO_ADMIN.email, 'wrong-password'), false)
})

test('drafts and media without rights do not become public', () => {
  const project = INITIAL_CONTENT.projects[0]
  assert.equal(isPublic('projects', project), true)
  assert.equal(isPublic('projects', { ...project, status: 'draft' }), false)
  assert.equal(
    isPublic('projects', { ...project, mediaApproved: false }),
    false,
  )
  assert.match(
    entryError('projects', { ...project, mediaApproved: false }),
    /rights/,
  )
})

test('profile listing requires each consent and representation approval', () => {
  assert.equal(profileApproved(approvedProfile), true)
  for (const field of [
    'listingApproved',
    'mediaApproved',
    'representationApproved',
  ]) {
    assert.equal(
      isPublic('profiles', { ...approvedProfile, [field]: false }),
      false,
    )
    assert.notEqual(
      entryError('profiles', { ...approvedProfile, [field]: false }),
      '',
    )
  }
  assert.equal(
    profileApproved({ ...approvedProfile, permissionNote: '' }),
    false,
  )
  assert.equal(profileApproved({ ...approvedProfile, consentDate: '' }), false)
  assert.equal(
    profileApproved({
      ...approvedProfile,
      relationship: 'Collaborator',
      representationApproved: false,
    }),
    true,
  )
})

test('unapproved profiles can be saved as drafts', () => {
  assert.equal(
    entryError('profiles', {
      ...approvedProfile,
      listingApproved: false,
      status: 'draft',
    }),
    '',
  )
})

test('only HTTPS and constrained local image paths are allowed', () => {
  assert.equal(safeUrl('/images/film.jpg', true), '/images/film.jpg')
  assert.equal(
    safeUrl('https://example.com/image.jpg'),
    'https://example.com/image.jpg',
  )
  for (const url of [
    'javascript:alert(1)',
    'data:text/html,hello',
    '//evil.example/photo',
    '/images/../secret',
    'http://example.com/image',
    'https://user:pass@example.com/image',
  ])
    assert.equal(safeUrl(url, true), '')
})

test('date validation rejects impossible calendar dates', () => {
  assert.equal(validDate('2026-10-18'), true)
  assert.equal(validDate('2026-02-30'), false)
  assert.equal(validDate('2026-99-01'), false)
  assert.equal(validDate('not-a-date'), false)
  assert.equal(validDate('2024-02-29'), true)
})

test('incomplete draft dates can be previewed without crashing', () => {
  assert.equal(formatDate(''), 'Date to be confirmed')
  assert.equal(formatDate('2026-02-30'), 'Date to be confirmed')
  assert.match(formatDate('2026-10-18'), /2026/)
})

test('seed data is a restorable, valid backup with no public profiles', () => {
  assert.equal(validateBackup(INITIAL_CONTENT), true)
  assert.equal(INITIAL_CONTENT.profiles.length, 0)
  assert.ok(INITIAL_CONTENT.projects.every((entry) => entry.sample))
})

test('backup validation rejects corrupted shapes, duplicate ids and invalid dates', () => {
  assert.equal(validateBackup({ version: 2 }), false)
  for (const mutate of [
    (copy) => {
      copy.projects[0].title = {}
    },
    (copy) => {
      copy.projects.push(copy.projects[0])
    },
    (copy) => {
      copy.projects[0].gallery = ['javascript:alert(1)']
    },
    (copy) => {
      copy.updates[0].date = '2026-02-30'
    },
    (copy) => {
      copy.projects[0].body = { invalid: true }
    },
    (copy) => {
      copy.profiles.push({ ...approvedProfile, mediaApproved: false })
    },
    (copy) => {
      copy.settings.instagram = 'javascript:alert(1)'
    },
  ]) {
    const copy = structuredClone(INITIAL_CONTENT)
    mutate(copy)
    assert.equal(validateBackup(copy), false)
  }
})

test('broken browser storage falls back to independent sample content', () => {
  const loaded = loadContent({ getItem: () => '{bad json' })
  assert.deepEqual(loaded, INITIAL_CONTENT)
  assert.notEqual(loaded, INITIAL_CONTENT)
  assert.deepEqual(
    loadContent({
      getItem: () => {
        throw new Error('Blocked storage')
      },
    }),
    INITIAL_CONTENT,
  )
})

test('contact settings reject unsafe links and malformed public details', () => {
  assert.equal(settingsError(INITIAL_CONTENT.settings), '')
  assert.notEqual(
    settingsError({ ...INITIAL_CONTENT.settings, email: 'not-an-email' }),
    '',
  )
  assert.notEqual(
    settingsError({ ...INITIAL_CONTENT.settings, phone: 'javascript:bad' }),
    '',
  )
  assert.equal(
    settingsError({
      ...INITIAL_CONTENT.settings,
      email: 'studio@example.com',
      phone: '+91 90000 00000',
    }),
    '',
  )
})

test('YouTube embeds use the privacy-enhanced origin and validate video ids', () => {
  assert.equal(
    videoEmbed('https://youtu.be/abcdefghijk'),
    'https://www.youtube-nocookie.com/embed/abcdefghijk',
  )
  assert.equal(
    videoEmbed('https://www.youtube.com/watch?v=abcdefghijk'),
    'https://www.youtube-nocookie.com/embed/abcdefghijk',
  )
  assert.equal(
    videoEmbed('https://youtube.com.evil.example/watch?v=abcdefghijk'),
    '',
  )
  assert.equal(videoEmbed('https://youtu.be/too-short'), '')
})
