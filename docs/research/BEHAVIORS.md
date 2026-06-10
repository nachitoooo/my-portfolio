# dimden.dev — Behaviors & Interactions

## Global Animations

### CRT Overlay (body::before + body::after)
- **Trigger**: always active (desktop ≥601px only)
- **Mechanism**: CSS `animation-name: Static`, `animation-duration: 2s / 0.8s`, `animation-timing-function: steps(4)`
- `@keyframes Static { 0% { background-position: 0px 0px; } 100% { background-position: 0px 4px; } }`
- overlay.png (opacity 0.2) + overlay2.png (opacity 0.5), both `position: fixed`, `z-index: 1000`
- `box-shadow: inset 0px 0px 10em rgb(0 0 0 / 40%)` on ::before

### Logo Flickering
- **Trigger**: always active
- **Mechanism**: `animation: flickering 0.07s infinite`
- `@keyframes flickering` — random opacity values per percentage step (0% → 0.63, 1% → 0.46, etc.)
- Applied to `#logo` element

### Hotel Text Flickering
- **Trigger**: always active
- **Mechanism**: `animation: flickering 0.1s infinite` (slightly slower)
- Applied to `#hotel` (ホテル float-right text)

### Snow Animation
- **Trigger**: always active (CSS only)
- **Mechanism**: `#snow` div with 3-layer background-image (s1.png, s2.png, s3.png)
- `animation: snow 100s linear infinite`
- `@keyframes snow`: moves bg positions from 0→5000px/10000px over 100s

### Rain Canvas
- **Trigger**: always active (JS canvas-based)
- **Element**: `#rain-canvas` canvas, `position: fixed`, `z-index: -2`, `opacity: 0.55`
- Rain drops fall continuously; interactive (rain bounces off elements with `.rain-hitbox` class)
- Checkboxes at bottom of sidebar can disable/mute

### FPS Counter
- **Trigger**: always active (JS updates every frame)
- **Element**: `#fps`, fixed top-left, lime color, `font-family: Digital`
- Shows current page framerate as integer (e.g., "165")

### Online Status Pulse (blob)
- **When online**: `.blob` class with `animation: pulse 2s infinite`
- `@keyframes pulse`: scale 0.95→1→0.95, box-shadow pulses green
- Currently offline: uses `.inblob` (no animation, gray color)

### Oneko Cat (cursor follower)
- **Trigger**: cursor movement
- **Mechanism**: `#oneko` div with `background-image: url(/images/oneko.gif)`, follows cursor via JS
- `position: fixed`

## Interactive Elements

### Mewo Cat (#mewo)
- Draggable pixel cat image (cursor: grab)
- `position: absolute`, `z-index: 500`
- JS drag-and-drop behavior

### Kirby Star (#kirby = #warpstar img)
- Clickable, `cursor: pointer`
- Triggers some animation (likely Kirby star cursor effect)

### Switch (#switch = electricity_on.png)
- Clickable, `cursor: pointer`
- Float right in Stars box

### Marquees
- Patron marquee: pauses on hover (`onmouseover="this.stop()"`)
- Song name marquee: scrollamount=3, pauses on hover
- Buttons misc: `scrollamount=3`, pauses on hover
- Buttons sites: `direction="right"`, `scrollamount=3`, pauses on hover

### Blog Arrows (.blog-arrow)
- Color `#156851` (dark green), `font-weight: bolder`
- ">" for newer posts, "-" for older posts

## Mobile Behavior (<920px)
- MENU button appears: fixed top-right, `font-family: Pixel NES`
- Sidebar slides in from right on click: `transform: translateX(0)`, transition 0.2s ease-in-out
- Backdrop overlay appears behind sidebar
- Body gets `overflow: hidden` when menu open

## Hover States
- All `a` links: `text-decoration: underline` on hover, `transition: 0.7s`
- `.navlink`: same hover underline

## Text Glow Effects
- Body text shadow: `0 0 20px #ffffff4a, 0 0 20px #00ffab45`
- H2 / link shadow: `0 0 20px #08bd9882`
- Status OK: `color: #36fda0; text-shadow: 0 0 20px #36fda0`
- Status Fail: `color: #ff5858; text-shadow: 0 0 20px #ff5858`
- Hotel: pink glow `#ff7ddb` with multi-layer text-shadow
- Offline: red text with multi-layer red text-shadow

## Image Rendering
- `image-rendering: pixelated` on body and #debug — ensures pixel-perfect rendering
- `font-smooth: never; -webkit-font-smoothing: none` — no anti-aliasing
