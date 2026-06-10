# dimden.dev — Page Topology

## Layout Overview
Fixed-width 900px container centered on black background. Two-column flex layout.
- Left column (#maintd): 675px
- Right sidebar (#menutd): 225px
- Mobile (<920px): stacks to single column, sidebar becomes fixed drawer

## Z-Index Layers (bottom to top)
- z -999: #bg (background image)
- z -5: #wires (decorative wires)
- z -2: #rain-canvas (rain animation canvas)
- z -1: #rain-div
- z auto: page content
- z 1: #snow (snow particle animation)
- z 3: #rainworld-slugcat
- z 5: #cursors (other users' cursors)
- z 500: #mewo (draggable cat)
- z 1000: body::before / body::after (CRT overlay)
- z 1200: #mobile-menu-backdrop
- z 1201: #menutd (mobile: fixed drawer)
- z 1203: #mobile-menu-toggle (mobile MENU button)

## Fixed/Sticky Overlays
- #fps: fixed top-left, lime "Digital" font, FPS counter
- #snow: fixed full-viewport, CSS background-image snow animation
- body::before: fixed CRT scanline overlay (overlay.png, Static keyframe)
- body::after: fixed CRT static overlay (overlay2.png, Static keyframe)
- #rain-canvas: fixed full-viewport canvas for rain drops
- #mewo: absolute cat image, draggable
- #doom-canvas: fixed bottom, z-index -1, optional

## Page Sections (top to bottom, visual order)

### 0. Decorative (above content)
- **#bg**: full-width bg.png (abstract dark background), absolute
- **#wires**: wires.png absolute above columns
- **#mewo**: mewo.png cat, absolute, draggable, z500
- **#logo**: pixel letter images (D1, IM, D2, E, N), flickering animation, centered above columns

### 1. Left Column (#maintd)
1. **#mainbox** (.box) — Welcome section
   - moon.png icon + h2 "Welcome to DIMDEN.DEV!"
   - dimden.gif avatar (float left, 100×94px)
   - Mood tracker link (#mood-div)
   - Text paragraphs, ul facts list
2. **Patron marquee** — scrolling thank-you text
3. **Blog box** (.box) — list of blog posts with arrows
4. **#projects-banner** — rotating banner image (currently OldTwitter gif)
5. **Projects box** (.box) — meow_knob, platform, slugcat decorations + project list
6. **Terminal box** (.box.terminal) — Systems status with "ホテル" float
7. **Chat box** (.box, hidden) — chat interface
8. **#webtiles-container** — WebTiles iframe + description

### 2. Right Sidebar (#menutd, max-width 225px)
1. **#linksdiv** (.box) — "Stars" navigation + warpstar + switch images
2. **Online status** (.box.centerbox) — "I'm Offline!" 
3. **Last song** (.box) — album art + song name marquee + artist
4. **#buttons-misc** (marquee) — 88×31 buttons scrolling
5. **#cool-sites** label + **#buttons-sites** (marquee, right direction) — site buttons
6. **Current status** (.box) — social post with avatar
7. **Moon phase widget** (#pre-yw)
8. **DIMDEN button** (.box.centerbox) — 88×31 hotlink button
9. **Hotline Webring** arrows
10. **Visit counter** (iframe incr.easrng.net)
11. **Settings** — checkboxes: hide cursor, hide others, mute rain, disable rain
12. Various bottom decorative pixel art

## Interaction Model
- STATIC: all content is static HTML
- ANIMATED: logo (flickering), hotel text (flickering), rain canvas, snow div, CRT overlays
- SCROLL: none (no scroll-driven behaviors)
- CLICK: mewo cat (draggable), switch (toggles something), kirby star (cursor animation?), mobile MENU button
- TIME: FPS counter updates, rain animation continuous

## Responsive Breakpoint: 920px
Below 920px:
- #container becomes 100% width with 8px padding
- #main-layout becomes block (stacks vertically)
- #maintd becomes 100% width
- #menutd becomes fixed right-side drawer with mobile toggle
- #wires hidden
