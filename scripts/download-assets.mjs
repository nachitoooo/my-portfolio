import { createWriteStream, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { pipeline } from 'stream/promises';
import https from 'https';
import http from 'http';

const BASE = 'https://dimden.dev';
const OUT = join(process.cwd(), 'public');

const assets = [
  // Fonts
  ['/fonts/Pixel_NES.woff', 'fonts/Pixel_NES.woff'],
  ['/fonts/pixelfonts/Web437_NEC_APC3_8x16.woff', 'fonts/Web437_NEC_APC3_8x16.woff'],
  ['/fonts/pixelfonts/Web437_Nix8810_M16.woff', 'fonts/Web437_Nix8810_M16.woff'],
  ['/fonts/Digital-7.ttf', 'fonts/Digital-7.ttf'],
  ['/fonts/Perfect DOS VGA 437 Win.ttf', 'fonts/Perfect_DOS_VGA_437_Win.ttf'],
  // Background & overlays
  ['/images/bg.png', 'images/bg.png'],
  ['/images/overlay.png', 'images/overlay.png'],
  ['/images/overlay2.png', 'images/overlay2.png'],
  ['/images/s1.png', 'images/s1.png'],
  ['/images/s2.png', 'images/s2.png'],
  ['/images/s3.png', 'images/s3.png'],
  // Wires & decorative
  ['/images/wires.png', 'images/wires.png'],
  ['/images/mewo.png', 'images/mewo.png'],
  ['/images/oneko.gif', 'images/oneko.gif'],
  // Logo letters
  ['/images/letters/D1.png', 'images/letters/D1.png'],
  ['/images/letters/IM.png', 'images/letters/IM.png'],
  ['/images/letters/D2.png', 'images/letters/D2.png'],
  ['/images/letters/E.png', 'images/letters/E.png'],
  ['/images/letters/N.png', 'images/letters/N.png'],
  // Icons
  ['/images/moon.png', 'images/moon.png'],
  ['/images/dimden.gif', 'images/dimden.gif'],
  ['/images/feedicon.svg', 'images/feedicon.svg'],
  ['/images/warpstar.png', 'images/warpstar.png'],
  ['/images/electricity_on.png', 'images/electricity_on.png'],
  ['/images/smoldimden.png', 'images/smoldimden.png'],
  ['/images/mail.png', 'images/mail.png'],
  ['/images/chat.png', 'images/chat.png'],
  // Projects section
  ['/images/meow_knob.png', 'images/meow_knob.png'],
  ['/images/platform.png', 'images/platform.png'],
  ['/images/slugcat.png', 'images/slugcat.png'],
  // Banners
  ['/images/banners/neocities.gif', 'images/banners/neocities.gif'],
  ['/images/banners/discord.png', 'images/banners/discord.png'],
  ['/images/banners/nekoweb.jpg', 'images/banners/nekoweb.jpg'],
  ['/images/banners/oldtwitter.gif', 'images/banners/oldtwitter.gif'],
  // Buttons (88x31)
  ['/images/buttons/atlas.gif', 'images/buttons/atlas.gif'],
  ['/images/buttons/win95.gif', 'images/buttons/win95.gif'],
  ['/images/buttons/undertale.gif', 'images/buttons/undertale.gif'],
  ['/images/buttons/uexpress.png', 'images/buttons/uexpress.png'],
  ['/images/buttons/beekeeping_in_ukraine.gif', 'images/buttons/beekeeping_in_ukraine.gif'],
  ['/images/buttons/Rain_World_button.gif', 'images/buttons/Rain_World_button.gif'],
  ['/images/buttons/OneShot_button.gif', 'images/buttons/OneShot_button.gif'],
  ['/images/buttons/krisbtn.png', 'images/buttons/krisbtn.png'],
  ['/images/buttons/debian.gif', 'images/buttons/debian.gif'],
  ['/images/buttons/phonechump.gif', 'images/buttons/phonechump.gif'],
  ['/images/buttons/jquery.gif', 'images/buttons/jquery.gif'],
  ['/images/buttons/best_chrome.gif', 'images/buttons/best_chrome.gif'],
  ['/images/buttons/madewithnotepad2.gif', 'images/buttons/madewithnotepad2.gif'],
  ['/images/buttons/neocities.gif', 'images/buttons/neocities.gif'],
  ['/images/buttons/cinni.gif', 'images/buttons/cinni.gif'],
  ['/images/buttons/mm4rk3t.gif', 'images/buttons/mm4rk3t.gif'],
  ['/images/buttons/amapy.gif', 'images/buttons/amapy.gif'],
  ['/images/buttons/fauux.gif', 'images/buttons/fauux.gif'],
  ['/images/buttons/rinnbnnr.jpg', 'images/buttons/rinnbnnr.jpg'],
  ['/images/buttons/poclbutton.gif', 'images/buttons/poclbutton.gif'],
  ['/images/buttons/ateliermwbnr.png', 'images/buttons/ateliermwbnr.png'],
  ['/images/buttons/apfel-button.png', 'images/buttons/apfel-button.png'],
  // Service button
  ['/services/images/88x31.gif', 'images/buttons/dimden_88x31.gif'],
  // Profile
  ['/images/dimdenpfp.jpg', 'images/dimdenpfp.jpg'],
  // Favicon
  ['/favicon.png', 'favicon.png'],
  // Other
  ['/images/kelvin.gif', 'images/kelvin.gif'],
  ['/images/minecraftblock.png', 'images/minecraftblock.png'],
  ['/images/BUTLER.png', 'images/BUTLER.png'],
  ['/images/sulphur.png', 'images/sulphur.png'],
  ['/images/dimdenomori2.png', 'images/dimdenomori2.png'],
  ['/images/tv.gif', 'images/tv.gif'],
  ['/images/basketball.png', 'images/basketball.png'],
  ['/rainsong/Rain_Song.png', 'images/Rain_Song.png'],
];

function fetch(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(res.headers.location).then(resolve).catch(reject);
      }
      resolve(res);
    }).on('error', reject);
  });
}

async function download(srcPath, outPath) {
  const url = BASE + srcPath;
  const dest = join(OUT, outPath);
  mkdirSync(dirname(dest), { recursive: true });
  try {
    const res = await fetch(url);
    if (res.statusCode !== 200) {
      console.warn(`SKIP ${url} (${res.statusCode})`);
      return;
    }
    await pipeline(res, createWriteStream(dest));
    console.log(`OK ${outPath}`);
  } catch (e) {
    console.warn(`FAIL ${url}: ${e.message}`);
  }
}

// Download 4 at a time
const BATCH = 4;
for (let i = 0; i < assets.length; i += BATCH) {
  await Promise.all(assets.slice(i, i + BATCH).map(([src, out]) => download(src, out)));
}
console.log('Done!');
