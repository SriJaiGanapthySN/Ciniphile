# Cinephile

A cinematic, responsive React website for a five-house creative collective. Built with React 19, Vite, React Router and Lucide; teal (`#024558`), light gray (`#E0E0E0`) and black (`#000000`), editorial typography, local photography and self-hosted fonts. The source requirements PDF is preserved in the parent folder.

## Run locally

Requires Node.js 22.12+ (developed with Node 24) and npm. From this folder:

```sh
npm install
npm run dev
```

Open the URL Vite prints, normally http://localhost:5173. Vite chooses another port if that port is occupied. Use the same hostname and port for persistence: browser storage is origin-specific.

```sh
npm run build
npm run preview
npm run lint
npm test
npm run test:e2e
```

Browser tests use the installed Microsoft Edge browser and cover desktop and mobile. To use a different browser, change `channel` in the Playwright configuration and install the corresponding Playwright browser. Screenshots, traces and reports are generated in ignored test output folders. `npm run format` formats the source.

Theme checks inspect rendered component colors across public routes, profiles, all six admin tabs and all three content editors. They also verify contrast, focus states, responsive layout and navigation. Photography retains its own colors; UI colors use the three-color palette and transparent variants.

## Example admin

Select **Login** in the header (also visible with the mobile menu closed), open `/login`, or select **Admin login** in the footer.

| Field    | Demo value             |
| -------- | ---------------------- |
| Email    | `admin@cinephile.demo` |
| Password | `Cinephile@2026`       |

Only this email/password combination opens the demo studio. Email matching trims whitespace and ignores case; the password is case-sensitive. The Admin navigation link is hidden before sign-in. Visiting `/admin` without a demo session redirects to `/login`.

**This is intentionally not secure authentication.** The credential and access logic are in client-side JavaScript and can be inspected or bypassed. Do not put private information in this prototype or treat the demo gate as authorization. There is no server, secret key, real email delivery or shared database.

## Included

- Shared theme: teal headers, page-title bands, primary actions, selected filters and navigation, table headers, form states and dialog accents throughout public pages, Login and the admin studio. Light-gray content surfaces and black text/footer complete the palette. Global tokens live in [src/styles.css](src/styles.css).
- Home: five equally sized actor portraits with matching frames and no actor-specific highlighting; Vijay stays centered in the hero and Tamil-cinema gallery. A full-width typographic interlude connects Cinephile's story to its featured work, followed by the five houses and recent updates.
- Motion: sequenced wordmark letters, moving film perforations, a continuous film-strip ticker, gentle mouse parallax, shutter-style image reveals, scroll-linked typography, a rotating reel, house-row hover sweeps and reading progress. Public pages add title reveals, staggered project/journal entrances, pointer-responsive image previews with focus brackets and an orbiting contact rim. A camera-focus cursor follows mouse movement, responds to links and pulses on clicks without replacing the native cursor or intercepting input. It is hidden on touch, over form fields/dialogs, during keyboard use, and on Login/Admin. The hero pause button and public-page header button share one pause setting across navigation; system reduced motion restores static, fully readable content and disables the cursor. Motion uses CSS and browser APIs without an animation-library dependency.
- Work: five category filters, search, concept labels and detail pages with roles, credits, galleries, optional videos and official links.
- Houses: purpose, services, work samples and enquiry links for Creative, Production, Film Promotion, Talent Management and Influencer Marketing.
- People: relationship labels, biographies, selected projects, official social links and permission-gated public profiles. No real profiles are seeded.
- Updates: categorized, dated stories; optional images, videos and links.
- Contact: enquiry types, validated form, honeypot, a local submission cooldown and an honest saved-in-this-browser confirmation. Official contact details are configurable, not invented.
- Admin: create, edit, preview, publish, unpublish and delete projects, profiles and updates; read/delete enquiries; edit official contact details; export and validate/restore JSON backups with replacement confirmation.
- Privacy: a prototype-specific notice, media permission rules, consent before loading YouTube embeds, accessible dialogs and reduced-motion support.
- Technical: responsive pages, local optimized images, lazy loading, self-hosted fonts, lazy-loaded admin code, dynamic titles/descriptions and basic Open Graph metadata.

## Local persistence

Content lives under `cinephile.content.v1` in localStorage. The demo login lives under `cinephile.demo-session` in sessionStorage. Edits survive reloads on the same browser origin; they are not synced across browsers, devices or existing tabs. Clearing browser storage restores the seeded concepts. Storage failures are reported rather than silently claiming a save succeeded.

Backups include enquiries and permission references; keep them private. Export regularly through the admin studio. There are no automatic or remote backups in this frontend-only prototype.

## Publication and media

Projects and updates require media approval to publish. Profiles additionally require public-listing approval, a valid consent date and an approval reference. Represented talent requires representation approval. Withdrawing an approval in the editor returns the record to draft; public lists, detail routes and metadata exclude drafts.

Use HTTPS image URLs or local `/images/` paths. Gallery fields accept one URL per line. Videos support privacy-enhanced YouTube embeds, HTTPS MP4/WebM URLs, or an external video link. Obtain permission for every photo, biography, credit and representation claim before publishing.

All seeded projects and updates are clearly identified as illustrative concepts. They are not real client work, releases or endorsements. Photo sources are downloaded from Unsplash under its [license](https://unsplash.com/license):

| Local image                         | Source                                                                                                    |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `projector.jpg` (film clapperboard) | [Unsplash photo 1485846234645-a62644f84728](https://images.unsplash.com/photo-1485846234645-a62644f84728) |
| `film.jpg`                          | [Unsplash photo 1440404653325-ab127d49abc1](https://images.unsplash.com/photo-1440404653325-ab127d49abc1) |
| `coast.jpg`                         | [Unsplash photo 1518837695005-2083093ee35b](https://images.unsplash.com/photo-1518837695005-2083093ee35b) |
| `city.jpg`                          | [Unsplash photo 1519501025264-65ba15a82390](https://images.unsplash.com/photo-1519501025264-65ba15a82390) |
| `stage.jpg`                         | [Unsplash photo 1503095396549-807759245b35](https://images.unsplash.com/photo-1503095396549-807759245b35) |
| `camera.jpg`                        | [Unsplash photo 1516035069371-29a1b244cc32](https://images.unsplash.com/photo-1516035069371-29a1b244cc32) |

Manrope, Barlow Condensed and Instrument Serif are distributed through Fontsource. Their license files are included with their installed packages. The icons come from Lucide.

### Tamil cinema portrait credits

The five actor portraits are an editorial appreciation of Tamil cinema, not portfolio work, endorsements, clients or represented-talent listings. They are stored separately from the permission-gated talent directory. No celebrity profiles have been added to that directory.

Public credits and source links are available under **Portrait credits & licenses** on the home page. All five active portraits are 450 x 600 movie-publicity crops with `object-fit: contain` and monochrome treatments, without silhouette cutouts, masking, overlap or hover zoom.

The Coolie, Good Bad Ugly, Leo, Vikram and Karuppu images are local-prototype references, not Creative Commons or otherwise cleared-for-reuse images. **Rights reserved; permission required before publication.** Studio/publisher credits and this rights notice are displayed publicly. Cropping and crediting an image do not grant publication permission.

| Portrait / Film | Attribution | Source | Original Artwork |
| --- | --- | --- | --- |
| Rajinikanth / Coolie | Sun Pictures | [Studio gallery](https://www.sunpictures.in/movies/coolie/) | [Coolie still](https://www.sunpictures.in/wp-content/uploads/2025/07/coolie-g-7.png) |
| Ajith Kumar / Good Bad Ugly | Mythri Movie Makers; via MovieCrow | [Poster announcement](https://www.moviecrow.com/News/33561/good-bad-ugly-team-celebrates-32-years-of-ajith-with-new-poster) | [32-years poster](https://static.moviecrow.com/gallery/20240803/232529-Good%20Bad%20Ugly%20Ajith%20Kumar%2032%20Years%20Poster.jpg) |
| Vijay / Leo | Seven Screen Studio | [Studio page](https://7screenstudio.com/movie/583/) | [Leo artwork](https://7screenstudio.com/wp-content/uploads/2025/09/Leo-1900x900-1.jpg) |
| Kamal Haasan / Vikram | Raaj Kamal Films International; still via Ananda Vikatan / MovieCrow | [Stills article](https://www.moviecrow.com/News/30522/vikram-censor-kamal-haasan-official-poster) | [Vikram still](https://static.moviecrow.com/gallery/20220525/198561-FTmqAHZXwAA2LTR.jfif) |
| Suriya / Karuppu | Dream Warrior Pictures | [Studio page](https://www.dwp.in/video/karuppu/) | [Karuppu artwork](https://www.dwp.in/file/wp-content/uploads/2025/08/karuppu-home-banner-2.jpg) |

The previous Commons portraits remain locally as unused alternatives. Their adaptations retain the following licenses; these licenses do not cover the new movie images or the rest of the website.

| Portrait | Attribution | Source | License |
| --- | --- | --- | --- |
| Rajinikanth | Dani Charles / Silverscreen Media Inc. | [MGR statue inauguration](<https://commons.wikimedia.org/wiki/File:Rajinikanth_at_the_Inauguration_of_MGR_Statue_(cropped).jpg>) | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| Ajith Kumar | Savieo Sebastian | [Ajith Kumar, 2019](https://commons.wikimedia.org/wiki/File:Ajith_kumar_2019.jpg) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| Kamal Haasan | Gage Skidmore | [San Diego Comic-Con portrait](https://commons.wikimedia.org/wiki/File:Kamal_Haasan_by_Gage_Skidmore.jpg) | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| Suriya | Epsajeevan | [Soorya Sivakumar](https://commons.wikimedia.org/wiki/File:Soorya_sivakumar.jpg) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |

## Static deployment and production gates

The build outputs `dist`. An SPA fallback is required for direct links to `/work/...`, `/updates/...` and other routes. Netlify-style fallback and security-header files are included in `public`; configure equivalent rules on another host. HTTPS is supplied by the chosen host, not by the local Vite server. These deployment rules have not been deployed to a real domain.

Before accepting real data or launching publicly:

1. Replace placeholder auth with server-verified sessions, administrator roles, invitation controls and protected API authorization. Never use the bundled demo password in production.
2. Move content, permissions and enquiries to a database/CMS with durable storage and media uploads. Enforce permission checks and validation server-side.
3. Connect a real contact endpoint and email provider. Add server-side rate limits and verified anti-spam protection; the current client-side measures are not a security boundary.
4. Configure the verified business email, phone, WhatsApp, social links and any approved public address. Replace concept content and verify all media rights.
5. Enable HTTPS, review security headers for the deployed services, and schedule encrypted backups with tested restores and appropriate retention.
6. Finalize the legal privacy notice, consent records, data-retention periods and privacy contact. This prototype policy is not legal advice.
7. Add the verified canonical domain, sitemap, production social images and prerendering/SSR for search and social crawlers that do not execute client-side metadata updates.
