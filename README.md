# RALLY Tennis Academy

Static single-page homepage. Open `index.html` through a local HTTP server to preview it.

## Content status

This is a client-facing **concept site**. The founding year, enrollment count, retention rate, all eight coach names, portraits, years of experience, claimed credentials, lesson prices, address, opening hours, phone number, and email address are fictional examples. Replace and verify every item before using the site for a real academy. The `.example` email domain is reserved for examples and cannot receive mail.

The credential *types* shown in coach profiles use real Korean sports instructor qualification names, including 1급/2급 생활스포츠지도사, 2급 전문스포츠지도사, and 유소년스포츠지도사. Fictional coaches must not be represented as verified holders. Official categories: [KSPO 생활스포츠지도사](https://sqms.kspo.or.kr/info/licenseInfoLsc2.kspo), [KSPO 전문스포츠지도사](https://sqms.kspo.or.kr/info/licenseInfoPsc2.kspo), [KSPO 유소년스포츠지도사](https://sqms.kspo.or.kr/info/licenseInfoYusc.kspo).

## Visual assets

- `assets/coach-01.webp` to `assets/coach-08.webp`: AI-generated fictional coach portraits, produced for this concept. Prompt direction: editorial Korean tennis-coach portraits on a dark green outdoor court, plain sportswear, racket, varied ages and expressions, no real person or logos.
- `assets/hero.mp4`: [Pexels video](https://www.pexels.com/video/a-tennis-player-serving-the-ball-4902771/)
- `assets/action.jpg`: [Unsplash photo](https://unsplash.com/photos/woman-plays-tennis-on-a-blue-court-4_V4b2VOZZI)
- `assets/court.jpg`: [Pexels photo](https://www.pexels.com/photo/aerial-view-of-tennis-courts-with-players-27151849/)
- `assets/coach.jpg`: [Unsplash photo](https://unsplash.com/photos/a-man-and-a-woman-playing-tennis-on-a-tennis-court-oDlLU_1hZwM)
- `assets/hero.jpg`: poster frame retained from the earlier site.
- `assets/serve-model.glb`: modified, black material version of the white mannequin and tennis serve animation from [Ultimate Animation Library — Free Demo](https://store.godotengine.org/asset/fabbio-mendoza/ultimate-animation-library/) by Fabbio Mendoza. Its custom license permits inclusion in finished commercial applications and modifications, but prohibits standalone redistribution of the pack or animation files. The site loads this model only as part of the opening scene.

## Opening animation

The player is a continuously animated 3D model rendered as a black silhouette. The racket is generated in Three.js, and a single `requestAnimationFrame` clock synchronizes the serve, ball, seam, and reveal. Browser refresh shows the opening again; clicking the top-left RALLY logo opens the homepage immediately. Animation timing targets 60 Hz where the device and browser permit it.

`src/intro-3d.js` is the source for the bundled `assets/intro-3d.js`. To rebuild, install `three` and `esbuild`, then run `npx esbuild src/intro-3d.js --bundle --format=esm --minify --outfile=assets/intro-3d.js`.
