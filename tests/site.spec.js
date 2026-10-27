import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { readFile } from 'node:fs/promises'
import { CONTENT_KEY, DEMO_ADMIN } from '../src/lib/content.js'

const TEAL = 'rgb(2, 69, 88)'
const LIGHT_GRAY = 'rgb(224, 224, 224)'

async function expectSiteTheme(page) {
  await page.mouse.move(0, 0)
  await expect(page.locator('.site-header')).toHaveCSS('background-color', TEAL)
  await expect(page.locator('.site-header')).toHaveCSS('color', LIGHT_GRAY)
  await expect(page.locator('body')).toHaveCSS('background-color', LIGHT_GRAY)
  const title = page.locator('main h1').first()
  const inverse = await title.evaluate((element) =>
    Boolean(element.closest('.hero, .page-heading')),
  )
  await expect(title).toHaveCSS('color', inverse ? LIGHT_GRAY : TEAL)
  const controls = await page
    .locator(
      '.button-dark, .filter-bar .selected, .admin-sidebar button.selected, .page-heading, .login-panel, .content-table th',
    )
    .evaluateAll((elements) =>
      elements.map((element) => {
        const styles = getComputedStyle(element)
        const inverse =
          element.matches('.button-dark') &&
          Boolean(element.closest('.login-form'))
        return {
          background: styles.backgroundColor,
          text: styles.color,
          inverse,
        }
      }),
    )
  for (const control of controls) {
    expect(control.background).toBe(control.inverse ? LIGHT_GRAY : TEAL)
    expect(control.text).toBe(control.inverse ? TEAL : LIGHT_GRAY)
  }
  const unexpectedColors = await page
    .locator('body *')
    .evaluateAll((elements) => {
      const allowed = new Set(['0,0,0', '2,69,88', '224,224,224'])
      const properties = [
        'color',
        'backgroundColor',
        'borderTopColor',
        'borderBottomColor',
        'outlineColor',
      ]
      const unexpected = []
      for (const element of elements) {
        if (!element.getClientRects().length) continue
        const styles = getComputedStyle(element)
        for (const property of properties) {
          const color = styles[property]
          const channels = color
            .match(/[\d.]+/g)
            ?.slice(0, 3)
            .join(',')
          if (channels && !allowed.has(channels))
            unexpected.push({
              element: element.tagName,
              className: element.getAttribute('class'),
              property,
              color,
            })
        }
      }
      return unexpected.slice(0, 15)
    })
  expect(unexpectedColors, `Off-palette components at ${page.url()}`).toEqual(
    [],
  )
}

async function signIn(page) {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Use demo credentials' }).click()
  await page.getByRole('button', { name: 'Enter the studio' }).click()
  await expect(page).toHaveURL(/\/admin$/)
}

async function adminTab(page, name) {
  await page
    .getByRole('navigation', { name: 'Admin sections' })
    .getByRole('button', { name, exact: true })
    .click()
}

async function readyImages(page) {
  return page.locator('img').evaluateAll(async (images) => {
    await Promise.all(
      images.map(async (image) => {
        image.loading = 'eager'
        try {
          await image.decode()
        } catch {
          return
        }
      }),
    )
    return images
      .filter((image) => !image.complete || image.naturalWidth === 0)
      .map((image) => image.src)
  })
}

test('public routes render, images load and layouts fit', async ({
  page,
}, testInfo) => {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  for (const route of [
    '/',
    '/work',
    '/houses',
    '/about',
    '/join',
    '/updates',
    '/contact',
    '/privacy',
    '/login',
    '/work/after-the-last-light',
    '/updates/the-first-flicker',
    '/not-a-page',
    '/people/missing-profile',
  ]) {
    await page.goto(route)
    await expect(page.locator('main h1')).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    await expectSiteTheme(page)
    expect(await readyImages(page), `Broken images at ${route}`).toEqual([])
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 1,
    )
    expect(overflow, `Horizontal overflow at ${route}`).toBe(false)
    if (
      [
        '/',
        '/work',
        '/houses',
        '/about',
        '/join',
        '/contact',
        '/login',
      ].includes(route)
    )
      await page.screenshot({
        path: testInfo.outputPath(
          `${route === '/' ? 'home' : route.slice(1)}.png`,
        ),
        fullPage: true,
      })
  }
  expect(errors).toEqual([])
})

test('editorial layout preserves navigation, responsive structure and motion controls', async ({
  page,
}) => {
  await page.goto('/')
  const sceneIndex = page.getByRole('navigation', {
    name: 'Choose your next scene',
  })
  await expect(sceneIndex.getByRole('link')).toHaveCount(3)
  await sceneIndex.getByRole('link', { name: /Meet the people/ }).click()
  await expect(page).toHaveURL(/\/about$/)
  await expect(page.locator('#founder-heading')).toBeVisible()
  await expect(page.locator('#ceo-heading')).toBeAttached()

  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 })
    for (const route of ['/about', '/work', '/updates', '/join']) {
      await page.goto(route)
      await page.evaluate(() => document.fonts.ready)
      const layout = await page.evaluate(() => {
        const title = document
          .querySelector('.page-heading h1')
          .getBoundingClientRect()
        const deck = document
          .querySelector('.heading-deck')
          .getBoundingClientRect()
        return {
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          split: deck.left >= title.right - 1,
          stacked: deck.top >= title.bottom - 1,
        }
      })
      expect(layout.overflow, `${route} at ${width}px`).toBe(false)
      expect(width > 760 ? layout.split : layout.stacked).toBe(true)
    }
  }

  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/about')
  const reel = page.locator('.heading-reel svg')
  await expect(reel).toHaveCSS('animation-name', 'reel-turn')
  await page.getByRole('button', { name: 'Pause animations' }).click()
  await expect(reel).toHaveCSS('animation-name', 'none')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(reel).toHaveCSS('animation-name', 'none')
  await page.goto('/login')
  await expect(page.locator('.editorial-site')).toHaveCount(0)
})

test('premiere hero keeps its title, portraits and scroll cue unclipped', async ({
  page,
}, testInfo) => {
  for (const size of [
    { width: 1920, height: 1080 },
    { width: 1839, height: 900 },
    { width: 1839, height: 512 },
    { width: 1440, height: 900 },
    { width: 1440, height: 700 },
    { width: 1200, height: 720 },
    { width: 1024, height: 768 },
    { width: 1440, height: 600 },
    { width: 768, height: 1024 },
    { width: 414, height: 896 },
    { width: 390, height: 844 },
    { width: 360, height: 740 },
    { width: 320, height: 640 },
    { width: 844, height: 390 },
    { width: 568, height: 320 },
  ]) {
    await page.setViewportSize(size)
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)
    await page
      .locator('.hero-portraits img')
      .evaluateAll((images) =>
        Promise.all(images.map((image) => image.decode())),
      )
    const bounds = await page.evaluate(() => ({
      heroBottom: document.querySelector('.hero').getBoundingClientRect()
        .bottom,
      periodRight: document
        .querySelector('.hero-period')
        .getBoundingClientRect().right,
      viewportWidth: document.documentElement.clientWidth,
      scrollCueBottom: document
        .querySelector('.hero-foot')
        .getBoundingClientRect().bottom,
      titleRight: document.querySelector('.hero h1').getBoundingClientRect()
        .right,
      contentWidth: document.documentElement.scrollWidth,
      clippedInterludeText: (() => {
        const scene = document
          .querySelector('.cinema-interlude')
          .getBoundingClientRect()
        return [...document.querySelectorAll('.interlude-line > *')]
          .filter((element) => {
            const range = document.createRange()
            range.selectNodeContents(element)
            const text = range.getBoundingClientRect()
            return text.left < scene.left + 8 || text.right > scene.right - 8
          })
          .map((element) => element.textContent)
      })(),
      portraitSizeRanges: [
        '.hero-portrait',
        '.hero-portrait img',
        '.cinema-portrait',
        '.cinema-portrait img',
      ].map((selector) => {
        const rectangles = [...document.querySelectorAll(selector)].map(
          (element) => element.getBoundingClientRect(),
        )
        const widths = rectangles.map((rectangle) => rectangle.width)
        const heights = rectangles.map((rectangle) => rectangle.height)
        return {
          selector,
          width: Math.max(...widths) - Math.min(...widths),
          height: Math.max(...heights) - Math.min(...heights),
        }
      }),
      portraitTreatments: [...document.querySelectorAll('.hero-portrait')].map(
        (element) => {
          const styles = getComputedStyle(element)
          return [styles.backgroundColor, styles.borderColor, styles.boxShadow]
        },
      ),
      splitArtistNames: [...document.querySelectorAll('.cinema-artist h3')]
        .filter(
          (heading) =>
            !heading.textContent.includes(' ') &&
            heading.getBoundingClientRect().height >
              parseFloat(getComputedStyle(heading).lineHeight) + 1,
        )
        .map((heading) => heading.textContent),
      vijayCenterOffset: (() => {
        const lineup = document
          .querySelector('.hero-portraits')
          .getBoundingClientRect()
        const vijay = document
          .querySelector('.hero-portrait-vijay')
          .getBoundingClientRect()
        return Math.abs(
          vijay.left + vijay.width / 2 - lineup.left - lineup.width / 2,
        )
      })(),
      galleryCenterOffset: (() => {
        const gallery = document
          .querySelector('.cinema-gallery')
          .getBoundingClientRect()
        const centered = document
          .querySelector('.cinema-artist-vijay')
          .getBoundingClientRect()
        return Math.abs(
          centered.left + centered.width / 2 - gallery.left - gallery.width / 2,
        )
      })(),
      portraitContentOverlaps: (() => {
        const content = [
          ...document.querySelectorAll('.hero-bottom > *, .hero-foot'),
        ].filter((element) => element.getClientRects().length)
        return [...document.querySelectorAll('.hero img')].flatMap((image) => {
          const photo = image.getBoundingClientRect()
          return content
            .filter((element) => {
              const bounds = element.getBoundingClientRect()
              return (
                photo.left < bounds.right &&
                photo.right > bounds.left &&
                photo.top < bounds.bottom &&
                photo.bottom > bounds.top
              )
            })
            .map((element) => ({
              portrait: image.parentElement.className,
              content: element.className || element.tagName,
            }))
        })
      })(),
      titlePhotoOverlaps: (() => {
        const heading = document.querySelector('.hero h1')
        const title = heading.getBoundingClientRect()
        const textRange = document.createRange()
        textRange.selectNodeContents(heading)
        const text = textRange.getBoundingClientRect()
        return [...document.querySelectorAll('.hero img')].filter((image) => {
          const bounds = image.getBoundingClientRect()
          const scale = Math.min(
            bounds.width / image.naturalWidth,
            bounds.height / image.naturalHeight,
          )
          const left =
            bounds.left + (bounds.width - image.naturalWidth * scale) / 2
          const right = left + image.naturalWidth * scale
          const top = bounds.bottom - image.naturalHeight * scale
          return (
            text.left < right &&
            text.right > left &&
            title.top < bounds.bottom &&
            title.bottom > top
          )
        }).length
      })(),
    }))
    expect(
      bounds.scrollCueBottom,
      `Scroll cue inside hero at ${size.width}x${size.height}`,
    ).toBeLessThanOrEqual(bounds.heroBottom + 1)
    expect(bounds.titleRight, `Title at ${size.width}px`).toBeLessThanOrEqual(
      bounds.viewportWidth,
    )
    expect(
      bounds.periodRight,
      `Wordmark at ${size.width}x${size.height}`,
    ).toBeLessThanOrEqual(bounds.viewportWidth - 10)
    expect(
      bounds.titlePhotoOverlaps,
      `Title/photo overlap at ${size.width}x${size.height}`,
    ).toBe(0)
    expect(
      bounds.portraitContentOverlaps,
      `Portrait/content overlap at ${size.width}x${size.height}`,
    ).toEqual([])
    expect(
      bounds.contentWidth,
      `Horizontal overflow at ${size.width}x${size.height}`,
    ).toBeLessThanOrEqual(bounds.viewportWidth + 1)
    expect(
      bounds.vijayCenterOffset,
      `Vijay centered at ${size.width}x${size.height}`,
    ).toBeLessThanOrEqual(1)
    expect(
      bounds.galleryCenterOffset,
      `Vijay gallery placement centered at ${size.width}x${size.height}`,
    ).toBeLessThanOrEqual(1)
    for (const group of bounds.portraitSizeRanges) {
      expect(
        group.width,
        `Equal portrait widths for ${group.selector} at ${size.width}x${size.height}`,
      ).toBeLessThanOrEqual(1)
      expect(
        group.height,
        `Equal portrait heights for ${group.selector} at ${size.width}x${size.height}`,
      ).toBeLessThanOrEqual(1)
    }
    for (const treatment of bounds.portraitTreatments) {
      expect(treatment, 'No actor-specific highlighting').toEqual(
        bounds.portraitTreatments[0],
      )
    }
    expect(
      bounds.splitArtistNames,
      `Actor names wrapping mid-word at ${size.width}x${size.height}`,
    ).toEqual([])
    expect(
      bounds.clippedInterludeText,
      `Clipped typography at ${size.width}x${size.height}`,
    ).toEqual([])
    await page.screenshot({
      path: testInfo.outputPath(`hero-${size.width}x${size.height}.png`),
    })
  }
})

test('Tamil cinema portraits and visible login work', async ({
  page,
}, testInfo) => {
  await page.goto('/')
  const names = [
    'Vijay',
    'Ajith Kumar',
    'Rajinikanth',
    'Kamal Haasan',
    'Suriya',
  ]
  await expect(page.locator('.hero-portraits img')).toHaveCount(5)
  await expect(page.locator('.cinema-artist')).toHaveCount(5)
  const moviePortraits = {
    rajinikanth: 'rajinikanth-coolie-portrait.jpg',
    'ajith-kumar': 'ajith-good-bad-ugly-portrait.jpg',
    vijay: 'vijay-leo-portrait.jpg',
    'kamal-haasan': 'kamal-vikram-portrait.jpg',
    suriya: 'suriya-karuppu-portrait.jpg',
  }
  for (const [artist, filename] of Object.entries(moviePortraits)) {
    for (const section of ['hero-portrait', 'cinema-artist']) {
      await expect(page.locator(`.${section}-${artist} img`)).toHaveAttribute(
        'src',
        `/images/${filename}`,
      )
    }
  }
  expect(await readyImages(page)).toEqual([])
  expect(
    await page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement)
      return ['--accent', '--paper', '--ink'].map((token) =>
        styles.getPropertyValue(token).trim(),
      )
    }),
  ).toEqual(['#024558', '#e0e0e0', '#000000'])
  const portraits = page.locator('.hero-portraits img, .cinema-portrait img')
  expect(
    await portraits.evaluateAll((images) =>
      images.every((image) => {
        const styles = getComputedStyle(image)
        return (
          styles.objectFit === 'contain' &&
          styles.clipPath === 'none' &&
          styles.maskImage === 'none' &&
          image.src.endsWith('-portrait.jpg')
        )
      }),
    ),
  ).toBe(true)
  for (const name of names) {
    await expect(
      page.locator('#tamil-cinema').getByRole('heading', { name, exact: true }),
    ).toBeVisible()
    await expect(
      page.getByRole('link', {
        name: `${name}: explore filmography (opens in a new tab)`,
      }),
    ).toHaveAttribute(
      'href',
      /https:\/\/en\.wikipedia\.org\/wiki\/.*filmography/,
    )
  }
  await expect(page.locator('.cinema-colophon')).toContainText(
    'not a claim of affiliation, endorsement or representation',
  )
  await page.evaluate(() => document.fonts.ready)
  await page
    .locator('.hero')
    .screenshot({ path: testInfo.outputPath('tamil-hero.png') })
  await page
    .locator('#tamil-cinema')
    .screenshot({ path: testInfo.outputPath('tamil-tribute.png') })
  await page.locator('#portrait-credits summary').click()
  const photoSources = {
    Rajinikanth: 'https://www.sunpictures.in/movies/coolie/',
    'Ajith Kumar':
      'https://www.moviecrow.com/News/33561/good-bad-ugly-team-celebrates-32-years-of-ajith-with-new-poster',
    Vijay: 'https://7screenstudio.com/movie/583/',
    'Kamal Haasan':
      'https://www.moviecrow.com/News/30522/vikram-censor-kamal-haasan-official-poster',
    Suriya: 'https://www.dwp.in/video/karuppu/',
  }
  for (const name of names) {
    await expect(
      page.getByRole('link', { name: `${name} photo source`, exact: true }),
    ).toHaveAttribute('href', photoSources[name])
  }
  await expect(page.locator('#portrait-credits')).toContainText(
    'Coolie, Good Bad Ugly, Leo, Vikram and Karuppu',
  )
  await expect(page.locator('#portrait-credits')).toContainText(
    'Rights reserved; permission required',
  )
  await page.goto('/')
  await expect(
    page.getByRole('link', { name: 'Login', exact: true }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Login', exact: true }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(
    page.getByRole('heading', { name: 'Welcome to the studio.' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Use demo credentials' }).click()
  await page.getByRole('button', { name: 'Enter the studio' }).click()
  await expect(page).toHaveURL(/\/admin$/)
  await expect(
    page.getByRole('link', { name: 'Login', exact: true }),
  ).toHaveCount(0)
  await page.goto('/houses')
  await expect(page.locator('.profile-card')).toHaveCount(0)
})

test('public-page motion shares pause state and keeps controls accessible', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/work')
  await expect(page.locator('main')).toHaveAttribute(
    'data-site-motion',
    'active',
  )
  await expect(page.locator('.page-heading h1')).toHaveCSS(
    'animation-name',
    'headline-uncover',
  )
  const preview = page.locator('.project-image').first()
  const finePointer = await page.evaluate(
    () => matchMedia('(hover: hover) and (pointer: fine)').matches,
  )
  if (finePointer) {
    await preview.hover({ position: { x: 35, y: 40 } })
    await expect
      .poll(() =>
        preview.evaluate((element) =>
          parseFloat(element.style.getPropertyValue('--preview-x')),
        ),
      )
      .toBeGreaterThan(0)
    await expect(preview.locator('.preview-frame')).toHaveCSS('opacity', '0.8')
    await page.screenshot({
      path: testInfo.outputPath('work-pointer-preview.png'),
    })
  }
  await page.getByRole('button', { name: 'Pause animations' }).click()
  await expect(page.locator('main')).toHaveAttribute(
    'data-site-motion',
    'paused',
  )
  await expect(page.locator('.page-heading h1')).toHaveCSS(
    'animation-name',
    'none',
  )
  await expect(preview.locator('img')).toHaveCSS('transform', 'none')
  await expect
    .poll(() =>
      preview.evaluate((element) =>
        element.style.getPropertyValue('--preview-x'),
      ),
    )
    .toBe('')
  await page.getByRole('link', { name: 'Latest updates', exact: true }).click()
  await expect(page).toHaveURL('/updates')
  await expect(
    page.getByRole('button', { name: 'Play animations' }),
  ).toBeVisible()
  await expect(page.locator('.update-card').first()).toHaveCSS('opacity', '1')
  await page.getByRole('button', { name: 'Play animations' }).click()
  await expect(page.locator('.update-card').first()).toHaveCSS(
    'animation-name',
    'proof-enter',
  )
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(
    page.getByRole('button', {
      name: 'Animations disabled by system preference',
    }),
  ).toBeDisabled()
  await expect(page.locator('.page-heading h1')).toHaveCSS(
    'animation-name',
    'none',
  )
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
    const header = await page.locator('.header-inner').evaluate((element) => {
      const brand = element.querySelector('.brand').getBoundingClientRect()
      const tools = element
        .querySelector('.header-tools')
        .getBoundingClientRect()
      return {
        noOverlap: brand.right <= tools.left,
        inside: tools.right <= innerWidth,
      }
    })
    expect(header).toEqual({ noOverlap: true, inside: true })
  }
  await page
    .getByRole('link', { name: 'Cinephile home', exact: true })
    .first()
    .click()
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const orbit = page.locator('.contact-orbit')
  await expect
    .poll(() =>
      orbit.evaluate(
        (element) => getComputedStyle(element, '::before').animationName,
      ),
    )
    .toBe('reel-turn')
  await page.getByRole('button', { name: 'Pause animations' }).click()
  await expect
    .poll(() =>
      orbit.evaluate(
        (element) => getComputedStyle(element, '::before').animationPlayState,
      ),
    )
    .toBe('paused')
})

test('camera cursor follows the pointer and respects input and motion preferences', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  const cursor = page.locator('.film-cursor')
  const finePointer = await page.evaluate(
    () => matchMedia('(hover: hover) and (pointer: fine)').matches,
  )
  await page.mouse.move(180, 250)
  if (!finePointer) {
    await expect(cursor).toHaveCSS('display', 'none')
    return
  }
  await expect(cursor).toHaveAttribute('data-active', 'true')
  await expect(cursor).toHaveCSS('pointer-events', 'none')
  await expect
    .poll(() =>
      page.locator('.cursor-position').evaluate((element) => {
        const bounds = element.getBoundingClientRect()
        return Math.abs(bounds.left + bounds.width / 2 - 180)
      }),
    )
    .toBeLessThan(1)
  await page.mouse.down()
  await expect(cursor).toHaveAttribute('data-pressed', 'true')
  await page.mouse.up()
  await expect(cursor).toHaveAttribute('data-pressed', 'false')
  await page.getByRole('link', { name: 'Explore our work' }).hover()
  await expect(cursor).toHaveAttribute('data-interactive', 'true')
  await page.screenshot({ path: testInfo.outputPath('camera-cursor.png') })
  await page.keyboard.press('Tab')
  await expect(cursor).toHaveAttribute('data-active', 'false')
  await page.mouse.move(180, 250)
  await expect(cursor).toHaveAttribute('data-active', 'true')
  await page.mouse.move(-10, -10)
  await expect(cursor).toHaveAttribute('data-active', 'false')
  await page.mouse.move(180, 250)
  await page
    .locator('body')
    .dispatchEvent('pointerdown', { pointerType: 'touch' })
  await expect(cursor).toHaveAttribute('data-active', 'false')
  await page.getByRole('button', { name: 'Pause animations' }).click()
  await page.mouse.move(180, 250)
  await expect(cursor).toHaveAttribute('data-active', 'false')
  await page.getByRole('link', { name: 'Explore our work' }).click()
  await page.mouse.move(180, 250)
  await expect(cursor).toHaveAttribute('data-active', 'false')
  await page.getByRole('link', { name: 'Home', exact: true }).click()
  await page.getByRole('button', { name: 'Play animations' }).click()
  await page.getByRole('link', { name: 'Explore our work' }).click()
  await expect(page).toHaveURL('/work')
  await page.mouse.move(200, 260)
  await expect(cursor).toHaveAttribute('data-active', 'true')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(cursor).toHaveCSS('display', 'none')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/contact')
  await page.locator('input:not([type="hidden"])').first().hover()
  await expect(cursor).toHaveAttribute('data-active', 'false')
  await page.goto('/login')
  await page.mouse.move(180, 250)
  await expect(cursor).toHaveAttribute('data-active', 'false')
})

test('cinematic motion pauses, reveals content and respects system preferences', async ({
  page,
}, testInfo) => {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  await expectSiteTheme(page)
  const experience = page.locator('.home-experience')
  const track = page.locator('.ticker-track')
  const reel = page.locator('.interlude-reel')
  const filmPanel = page.locator('.premiere-stage')
  const scene = page.locator('.cinema-interlude')
  await expect(page.locator('.hero-letter')).toHaveCount(10)
  await expect(
    page.getByRole('heading', { name: 'Cinema. With soul.', exact: true }),
  ).toBeVisible()
  await expect(experience).toHaveAttribute('data-motion', 'active')
  await expect(filmPanel).toHaveCSS('animation-name', 'premiere-float')
  await expect(page.locator('.hero')).toHaveCSS('overflow', 'hidden')
  await expect
    .poll(() =>
      reel.evaluate((element) => element.getAnimations()[0]?.playState),
    )
    .toBe('running')
  await expect
    .poll(() =>
      track.evaluate((element) => element.getAnimations()[0]?.playState),
    )
    .toBe('running')
  const started = await track.evaluate(
    (element) => element.getAnimations()[0].currentTime,
  )
  await expect
    .poll(() =>
      track.evaluate((element) => element.getAnimations()[0].currentTime),
    )
    .toBeGreaterThan(started)
  if (
    await page.evaluate(
      () => matchMedia('(hover: hover) and (pointer: fine)').matches,
    )
  ) {
    await page.mouse.move(100, 240)
    await expect
      .poll(() =>
        experience.evaluate((element) =>
          element.style.getPropertyValue('--scene-x'),
        ),
      )
      .not.toBe('0px')
  }
  await page.getByRole('button', { name: 'Pause animations' }).click()
  await expect(experience).toHaveAttribute('data-motion', 'paused')
  await expect(filmPanel).toHaveCSS('animation-play-state', 'paused')
  const panelPaused = await filmPanel.evaluate(async (element) => {
    const animation = element.getAnimations()[0]
    const before = animation.currentTime
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    )
    return animation.currentTime === before
  })
  expect(panelPaused).toBe(true)
  await expect
    .poll(() =>
      reel.evaluate((element) => element.getAnimations()[0]?.playState),
    )
    .toBe('paused')
  await expect
    .poll(() =>
      track.evaluate((element) => element.getAnimations()[0]?.playState),
    )
    .toBe('paused')
  await expect(page.locator('[data-reveal="waiting"]')).toHaveCount(0)
  const frozen = await track.evaluate(async (element) => {
    const animation = element.getAnimations()[0]
    const before = animation.currentTime
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    )
    return animation.currentTime === before
  })
  expect(frozen).toBe(true)
  await page.getByRole('button', { name: 'Play animations' }).click()
  await expect(experience).toHaveAttribute('data-motion', 'active')
  await page.locator('.cinema-artist').first().scrollIntoViewIfNeeded()
  await expect(page.locator('.cinema-artist').first()).toHaveAttribute(
    'data-reveal',
    'visible',
  )
  await expect
    .poll(() =>
      experience.evaluate((element) =>
        Number(element.style.getPropertyValue('--reading-progress')),
      ),
    )
    .toBeGreaterThan(0)
  await page.locator('.cinema-artist a').first().hover()
  expect(
    await page
      .locator('.cinema-portrait img')
      .first()
      .evaluate((image) => getComputedStyle(image).transform),
  ).toBe('none')
  await scene.scrollIntoViewIfNeeded()
  const sceneStarted = await scene.evaluate((element) =>
    Number(element.style.getPropertyValue('--scene-progress')),
  )
  await page.evaluate(() => window.scrollBy({ top: 150, behavior: 'instant' }))
  await expect
    .poll(() =>
      scene.evaluate((element) =>
        Number(element.style.getPropertyValue('--scene-progress')),
      ),
    )
    .toBeGreaterThan(sceneStarted)
  await scene.screenshot({
    path: testInfo.outputPath('scroll-typography.png'),
  })
  await page
    .getByRole('link', { name: 'See what we make' })
    .scrollIntoViewIfNeeded()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(experience).toHaveAttribute('data-motion', 'reduced')
  await expect(
    page.getByRole('button', {
      name: 'Animations disabled by system preference',
    }),
  ).toBeDisabled()
  await expect
    .poll(() =>
      track.evaluate((element) => getComputedStyle(element).animationName),
    )
    .toBe('none')
  await expect(reel).toHaveCSS('animation-name', 'none')
  await expect(filmPanel).toHaveCSS('animation-name', 'none')
  expect(
    await scene.evaluate((element) =>
      element.style.getPropertyValue('--scene-progress'),
    ),
  ).toBe('1')
  await expect(page.locator('[data-reveal="waiting"]')).toHaveCount(0)
  expect(
    await experience.evaluate((element) =>
      element.style.getPropertyValue('--scene-x'),
    ),
  ).toBe('0px')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect(experience).toHaveAttribute('data-motion', 'active')
  await expect
    .poll(() =>
      track.evaluate((element) => element.getAnimations()[0]?.playState),
    )
    .toBe('running')
  await page.getByRole('link', { name: 'See what we make' }).click()
  await expect(page).toHaveURL(/\/work$/)
  expect(errors).toEqual([])
})

test('navigation, house links, project search and update filters work', async ({
  page,
}) => {
  await page.goto('/')
  if (await page.getByRole('button', { name: 'Open navigation' }).isVisible())
    await page.getByRole('button', { name: 'Open navigation' }).click()
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Work', exact: true })
    .click()
  await expect(page).toHaveURL(/\/work$/)
  await page.getByRole('button', { name: /^Production/ }).click()
  await expect(page.locator('.project-card')).toHaveCount(1)
  await expect(page.locator('.project-card')).toContainText(
    'After the last light',
  )
  await page.getByRole('button', { name: /^All work/ }).click()
  await page
    .getByRole('textbox', { name: 'Search projects' })
    .fill('no matching story')
  await expect(
    page.getByRole('heading', { name: 'No stories in this frame.' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Clear search' }).click()
  await expect(page.locator('.project-card')).toHaveCount(5)
  await page.locator('.project-card').first().click()
  await expect(
    page.getByRole('heading', { name: 'After the last light.' }),
  ).toBeVisible()
  await page.goto('/houses#production')
  await page
    .locator('#production')
    .getByRole('link', { name: "Let's create together" })
    .click()
  await expect(page.getByLabel('What brings you here?')).toHaveValue(
    'Production House',
  )
  await page.goto('/updates')
  await page.getByRole('button', { name: 'Music', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'A little quiet between takes.' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Films', exact: true }).click()
  await expect(page.locator('.update-card')).toHaveCount(1)
})

test('the demo admin link is hidden from visitors and other credentials fail', async ({
  page,
}, testInfo) => {
  await page.goto('/')
  await expect(
    page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name: 'Admin', exact: true }),
  ).toHaveCount(0)
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/login$/)
  await page
    .getByLabel('Email address', { exact: true })
    .fill('not-admin@example.com')
  await page.getByLabel('Password', { exact: true }).fill(DEMO_ADMIN.password)
  await page.getByRole('button', { name: 'Enter the studio' }).click()
  await expect(page.getByRole('alert')).toContainText('do not match')
  await page.getByRole('button', { name: 'Use demo credentials' }).click()
  await page.getByRole('button', { name: 'Enter the studio' }).click()
  await expect(page).toHaveURL(/\/admin$/)
  await page.evaluate(() => document.fonts.ready)
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth + 1,
      ),
    )
    .toBe(false)
  if (await page.getByRole('button', { name: 'Open navigation' }).isVisible())
    await page.getByRole('button', { name: 'Open navigation' }).click()
  await expect(
    page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name: 'Admin', exact: true }),
  ).toHaveCount(1)
  if (await page.getByRole('button', { name: 'Close navigation' }).isVisible())
    await page.getByRole('button', { name: 'Close navigation' }).click()
  await page.screenshot({
    path: testInfo.outputPath('admin.png'),
    fullPage: true,
  })
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Behind the scenes.' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Sign out', exact: true }).click()
  await expect(page).toHaveURL(/\/login$/)
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/login$/)
})

test('projects can be drafted, previewed, edited, published, unpublished and deleted', async ({
  page,
}) => {
  await signIn(page)
  await adminTab(page, 'Projects')
  await page.getByRole('button', { name: 'New project', exact: true }).click()
  let dialog = page.getByRole('dialog', { name: 'New project', exact: true })
  await dialog.getByLabel('Title *', { exact: true }).fill('Test film story')
  await dialog
    .getByLabel('Short description *', { exact: true })
    .fill('A fictional test project about light and movement.')
  const bounds = await dialog.evaluate((element) => ({
    left: element.getBoundingClientRect().left,
    right: element.getBoundingClientRect().right,
    viewport: document.documentElement.clientWidth,
    contentWidth: element.scrollWidth,
    innerWidth: element.clientWidth,
  }))
  expect(bounds.left).toBeGreaterThanOrEqual(0)
  expect(bounds.right).toBeLessThanOrEqual(bounds.viewport)
  expect(bounds.contentWidth).toBeLessThanOrEqual(bounds.innerWidth + 1)
  await dialog.getByRole('button', { name: 'Save changes' }).click()
  await expect(dialog).not.toBeVisible()
  const id = await page.evaluate(
    (key) =>
      JSON.parse(localStorage.getItem(key)).projects.find(
        (entry) => entry.title === 'Test film story',
      ).id,
    CONTENT_KEY,
  )
  await page
    .getByRole('button', { name: 'Preview Test film story', exact: true })
    .click()
  await expect(
    page
      .getByRole('dialog', { name: 'Content preview' })
      .getByRole('heading', { name: 'Test film story.' }),
  ).toBeVisible()
  await page
    .getByRole('dialog', { name: 'Content preview' })
    .getByRole('button', { name: 'Close dialog' })
    .click()
  await page.goto(`/work/${id}`)
  await expect(page.getByRole('heading', { name: /This scene/ })).toBeVisible()
  await expect(page).not.toHaveTitle(/Test film story/)
  await page.goto('/admin')
  await adminTab(page, 'Projects')
  await page
    .getByRole('button', { name: 'Publish Test film story', exact: true })
    .click()
  await expect(page.getByRole('alert')).toContainText('rights')
  await page
    .getByRole('button', { name: 'Test film story', exact: true })
    .click()
  dialog = page.getByRole('dialog', { name: 'Edit project' })
  await dialog
    .getByLabel('Title *', { exact: true })
    .fill('Test film, final cut')
  await dialog.getByLabel('Cinephile has the rights').check()
  await dialog.getByLabel('Visibility').selectOption('published')
  await dialog.getByRole('button', { name: 'Save changes' }).click()
  await expect(dialog).not.toBeVisible()
  await page.goto(`/work/${id}`)
  await expect(
    page.getByRole('heading', { name: 'Test film, final cut.' }),
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Test film, final cut.' }),
  ).toBeVisible()
  await page.goto('/admin')
  await adminTab(page, 'Projects')
  await page
    .getByRole('button', {
      name: 'Unpublish Test film, final cut',
      exact: true,
    })
    .click()
  await expect(
    page.getByRole('row').filter({ hasText: 'Test film, final cut' }),
  ).toContainText('draft')
  await page
    .getByRole('button', { name: 'Delete Test film, final cut', exact: true })
    .click()
  await page.getByRole('button', { name: 'Delete record', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Test film, final cut', exact: true }),
  ).toHaveCount(0)
})

test('profiles require recorded permission and permission withdrawal removes publication', async ({
  page,
}) => {
  await signIn(page)
  await adminTab(page, 'Profiles')
  await page.getByRole('button', { name: 'New profile' }).click()
  let dialog = page.getByRole('dialog', { name: 'New profile' })
  await dialog.getByLabel('Public name *').fill('Approved demo person')
  await dialog
    .getByLabel('Short biography *')
    .fill(
      'A fictional test profile. Not a real person or representation claim.',
    )
  await dialog
    .getByLabel('Relationship to Cinephile')
    .selectOption('Represented talent')
  await dialog.getByLabel('Visibility').selectOption('published')
  await dialog.getByRole('button', { name: 'Save changes' }).click()
  await expect(dialog.getByRole('alert')).toContainText('Record listing')
  await dialog.getByLabel('Permission to publicly list this person').check()
  await dialog.getByLabel('Permission to publish the photo').check()
  await dialog
    .getByLabel('There is explicit permission to claim representation')
    .check()
  await dialog.getByLabel('Consent date').fill('2026-10-18')
  await dialog
    .getByLabel('Permission reference')
    .fill('Demo permission reference only')
  await dialog.getByRole('button', { name: 'Save changes' }).click()
  await expect(dialog).not.toBeVisible()
  const id = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)).profiles[0].id,
    CONTENT_KEY,
  )
  await page.goto('/houses')
  await expect(
    page.getByRole('link').filter({ hasText: 'Approved demo person' }),
  ).toBeVisible()
  await page.goto(`/people/${id}`)
  await expect(
    page.getByRole('heading', { name: 'Approved demo person', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText('Represented talent', { exact: true }),
  ).toBeVisible()
  await expectSiteTheme(page)
  await page.goto('/admin')
  await adminTab(page, 'Profiles')
  await page
    .getByRole('button', { name: 'Approved demo person', exact: true })
    .click()
  dialog = page.getByRole('dialog', { name: 'Edit profile' })
  await dialog.getByLabel('Permission to publicly list this person').uncheck()
  await expect(dialog.getByLabel('Visibility')).toHaveValue('draft')
  await dialog.getByRole('button', { name: 'Save changes' }).click()
  await page.goto(`/people/${id}`)
  await expect(page.getByRole('heading', { name: /This scene/ })).toBeVisible()
})

test('contact form stores a demo enquiry and admin can read and remove it', async ({
  page,
}) => {
  await page.goto('/contact?type=creative')
  await expect(page.getByLabel('What brings you here?')).toHaveValue(
    'Creative House',
  )
  await page.getByLabel('Your name').fill('Test visitor')
  await page.getByLabel('Email address').fill('visitor@example.com')
  await page
    .getByLabel('A little about your idea')
    .fill('A sample enquiry for an independent film campaign.')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Start the conversation' }).click()
  await expect(page.getByRole('status')).toContainText('No email was sent')
  await signIn(page)
  await page
    .getByRole('navigation', { name: 'Admin sections' })
    .getByRole('button', { name: /^Enquiries/ })
    .click()
  await page.getByRole('button', { name: /Test visitor/ }).click()
  const dialog = page.getByRole('dialog', { name: 'Enquiry details' })
  await expect(dialog).toContainText(
    'A sample enquiry for an independent film campaign.',
  )
  await dialog.getByRole('button', { name: 'Delete enquiry' }).click()
  await page
    .getByRole('dialog', { name: 'Delete this record?' })
    .getByRole('button', { name: 'Delete record' })
    .click()
  await expect(
    page.getByRole('heading', { name: 'An open door.' }),
  ).toBeVisible()
})

test('updates, official contacts and validated backup restore work', async ({
  page,
}) => {
  await signIn(page)
  await adminTab(page, 'Updates')
  await page.getByRole('button', { name: 'New update' }).click()
  const dialog = page.getByRole('dialog', { name: 'New update' })
  await dialog
    .getByLabel('Title *', { exact: true })
    .fill('New test announcement')
  await dialog
    .getByLabel('Short description *')
    .fill('A sample release announcement for a test project.')
  await dialog
    .getByLabel('Category', { exact: true })
    .selectOption('Announcements')
  await dialog.getByLabel('Cinephile has the rights').check()
  await dialog.getByLabel('Visibility').selectOption('published')
  await dialog.getByRole('button', { name: 'Save changes' }).click()
  await expect(dialog).not.toBeVisible()
  await page.goto('/updates')
  await page.getByRole('button', { name: 'Announcements', exact: true }).click()
  await expect(page.locator('.update-card')).toContainText(
    'New test announcement',
  )
  await page.goto('/admin')
  await adminTab(page, 'Settings')
  await page
    .getByLabel('Official email', { exact: true })
    .fill('studio@example.com')
  await page.getByLabel('Public phone number').fill('+91 90000 00000')
  await page.getByLabel('WhatsApp (with country code)').fill('+91 90000 00000')
  await page.getByRole('button', { name: 'Save contact details' }).click()
  await expect(page.getByRole('status')).toContainText('contact details saved')
  await page.goto('/contact')
  await expect(
    page.getByRole('link', { name: 'studio@example.com' }),
  ).toHaveAttribute('href', 'mailto:studio@example.com')
  await expect(
    page.getByRole('link', { name: 'Chat on WhatsApp' }),
  ).toHaveAttribute('href', 'https://wa.me/919000000000')
  await page.goto('/admin')
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export backup', exact: true }).click()
  const download = await downloadPromise
  const backup = JSON.parse(await readFile(await download.path(), 'utf8'))
  expect(backup.settings.email).toBe('studio@example.com')
  expect(JSON.stringify(backup)).not.toContain(DEMO_ADMIN.password)
  await adminTab(page, 'Settings')
  await page.getByLabel('Restore backup', { exact: true }).setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":1}'),
  })
  await expect(page.getByRole('alert')).toContainText(
    'not a valid Cinephile backup',
  )
  backup.projects[0].title = 'Restored project headline'
  await page.getByLabel('Restore backup', { exact: true }).setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  })
  await page.getByRole('button', { name: 'Replace and restore' }).click()
  await expect(page.getByRole('status')).toContainText('Backup restored')
  await page.goto(`/work/${backup.projects[0].id}`)
  await expect(
    page.getByRole('heading', { name: 'Restored project headline.' }),
  ).toBeVisible()
})

test('overview shortcuts create records and open filtered draft lists', async ({
  page,
}) => {
  await signIn(page)
  await page.getByRole('button', { name: 'Create new update' }).click()
  const dialog = page.getByRole('dialog', { name: 'New update' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Close dialog' }).click()
  await page.getByRole('button', { name: 'Review Projects drafts' }).click()
  await expect(
    page
      .getByRole('navigation', { name: 'Admin sections' })
      .getByRole('button', { name: 'Projects', exact: true }),
  ).toHaveAttribute('aria-current', 'page')
  await expect(page.getByLabel('Filter by status')).toHaveValue('draft')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('.admin-panel')).toHaveCSS('animation-name', 'none')
})

test('all admin tabs and editor components share the site theme', async ({
  page,
}, testInfo) => {
  test.setTimeout(90000)
  await signIn(page)
  for (const tab of [
    'Overview',
    'Projects',
    'Updates',
    'Profiles',
    'Enquiries',
    'Settings',
  ]) {
    await adminTab(page, tab)
    await expectSiteTheme(page)
    await expect(page.locator('.admin-sidebar button.selected')).toHaveCSS(
      'background-color',
      TEAL,
    )
    if (await page.locator('.content-table th').count()) {
      await expect(page.locator('.content-table th').first()).toHaveCSS(
        'background-color',
        TEAL,
      )
      await expect(page.locator('.content-table th').first()).toHaveCSS(
        'color',
        LIGHT_GRAY,
      )
    }
    const results = await new AxeBuilder({ page })
      .include('.admin-studio')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()
    expect(
      results.violations.map(({ id, nodes }) => ({
        id,
        elements: nodes.map((node) => node.target),
      })),
      tab,
    ).toEqual([])
    if (tab === 'Overview' || tab === 'Settings')
      await page.screenshot({
        path: testInfo.outputPath(`theme-admin-${tab.toLowerCase()}.png`),
        fullPage: true,
      })
  }
  for (const [tab, name] of [
    ['Projects', 'New project'],
    ['Updates', 'New update'],
    ['Profiles', 'New profile'],
  ]) {
    await adminTab(page, tab)
    await page.getByRole('button', { name, exact: true }).click()
    const dialog = page.getByRole('dialog', { name, exact: true })
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveCSS('background-color', LIGHT_GRAY)
    await expect(dialog).toHaveCSS('border-top-color', TEAL)
    const field = dialog.locator('input:not([type="checkbox"])').first()
    await field.focus()
    await expect(field).toHaveCSS('outline-color', TEAL)
    await expectSiteTheme(page)
    const results = await new AxeBuilder({ page })
      .include('.editor-modal')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()
    expect(
      results.violations.map(({ id, nodes }) => ({
        id,
        elements: nodes.map((node) => node.target),
      })),
      name,
    ).toEqual([])
    await dialog
      .getByRole('button', { name: 'Close dialog', exact: true })
      .click()
  }
})

test('public pages and login pass automated accessibility checks', async ({
  page,
}) => {
  test.setTimeout(90000)
  for (const route of [
    '/',
    '/work',
    '/houses',
    '/about',
    '/join',
    '/updates',
    '/contact',
    '/privacy',
    '/login',
    '/work/after-the-last-light',
    '/updates/the-first-flicker',
    '/not-a-page',
  ]) {
    await page.goto(route)
    await page.evaluate(() => document.fonts.ready)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()
    expect(
      results.violations.map(({ id, nodes }) => ({
        id,
        elements: nodes.map((node) => node.target),
      })),
      route,
    ).toEqual([])
  }
})
