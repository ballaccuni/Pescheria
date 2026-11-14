// Renders build/porto-explainer.html to an MP4: window.seek(i/30) per frame -> ffmpeg, audio via SOUND.renderOffline.
// Usage: node render.js [out.mp4]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
(async () => {
  const html = path.resolve(__dirname, 'build/porto-explainer.html');
  const out = path.resolve(process.argv[2] || path.join(__dirname, 'build/porto-explainer.mp4'));
  const FPS = 30, SR = 48000;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', (e) => console.error('page error:', e.message));
  await page.goto('file://' + html);
  await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  const D = await page.evaluate(() => window.DURATION);

  // audio
  const b64 = await page.evaluate(async (SR) => {
    const f = await SOUND.renderOffline(window.scoreSound, window.DURATION, SR, { voiceover: false });
    const i16 = new Int16Array(f.length); let peak = 0;
    for (let i = 0; i < f.length; i++) { const v = Math.max(-1, Math.min(1, f[i])); peak = Math.max(peak, Math.abs(v)); i16[i] = v * 32767; }
    console.log('audio peak', peak.toFixed(3));
    let s = ''; const u8 = new Uint8Array(i16.buffer); for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return btoa(s);
  }, SR);
  const pcm = Buffer.from(b64, 'base64'), hdr = Buffer.alloc(44);
  hdr.write('RIFF', 0); hdr.writeUInt32LE(36 + pcm.length, 4); hdr.write('WAVE', 8); hdr.write('fmt ', 12);
  hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(2, 22); hdr.writeUInt32LE(SR, 24); hdr.writeUInt32LE(SR * 4, 28); hdr.writeUInt16LE(4, 32); hdr.writeUInt16LE(16, 34);
  hdr.write('data', 36); hdr.writeUInt32LE(pcm.length, 40);
  const wav = path.join(os.tmpdir(), 'porto-audio.wav'); fs.writeFileSync(wav, Buffer.concat([hdr, pcm]));

  // video
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-', '-i', wav,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const N = Math.round(D * FPS);
  for (let i = 0; i < N; i++) {
    const data = await page.evaluate((t) => { window.seek(t); return document.getElementById('cv').toDataURL('image/png'); }, i / FPS);
    if (!ff.stdin.write(Buffer.from(data.slice(22), 'base64'))) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 60 === 0) process.stdout.write(`frame ${i}/${N}\n`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await browser.close();
  console.log('wrote', out);
})();
