/**
 * ECHO. — Fast Video Capture
 * Uses Puppeteer + page-level MediaRecorder for direct WebM output
 * No FFmpeg needed. Runs in ~40 seconds.
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const HTML_FILE = path.resolve(__dirname, 'mockup-video.html');
const OUTPUT_FILE = path.resolve(__dirname, 'echo-showcase.webm');
const DURATION_MS = 38000;
const WIDTH = 1280;
const HEIGHT = 720;

async function captureVideo() {
  console.log('');
  console.log('  ╔══════════════════════════════════╗');
  console.log('  ║   ECHO. Video Capture             ║');
  console.log('  ║   Direct WebM Recording            ║');
  console.log('  ╚══════════════════════════════════╝');
  console.log('');
  console.log(`  📐 ${WIDTH}x${HEIGHT} | ⏱ ${DURATION_MS/1000}s | 📁 echo-showcase.webm`);
  console.log('');

  // Launch browser
  console.log('  🚀 Launching Chrome...');
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: WIDTH, height: HEIGHT },
    args: [
      `--window-size=${WIDTH},${HEIGHT}`,
      '--disable-web-security',
      '--autoplay-policy=no-user-gesture-required',
      '--enable-features=WebRtcHideLocalIpsWithMdns',
      '--no-sandbox',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT });

  // Navigate
  console.log('  📄 Loading page...');
  await page.goto(`file://${HTML_FILE}`, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  console.log('  ✅ Page ready');

  // Inject a MediaRecorder into the page that records the page via canvas capture
  console.log('  🔴 Recording...');

  const webmBase64 = await page.evaluate(async (durationMs, width, height) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Create an offscreen canvas that mirrors the page
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Use html2canvas-style approach: capture via repeated screenshots
        // Actually, let's use a simpler approach: capture the entire document
        // via a video stream of the canvas

        const stream = canvas.captureStream(24);
        const recorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp8',
          videoBitsPerSecond: 5000000,
        });

        const chunks = [];
        recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

        const recordingDone = new Promise(res => {
          recorder.onstop = () => res();
        });

        recorder.start(100); // collect data every 100ms

        // Render frames by taking snapshots of document
        const fps = 24;
        const interval = 1000 / fps;
        const totalFrames = Math.ceil(durationMs / interval);

        // We'll use a different technique: just draw a solid frame
        // to show recording is working, but the actual content
        // is better captured via CDP screencast

        // Simple: just keep canvas updated
        // Actually in headless, we can't easily screenshot to canvas
        // Let's just signal back and use CDP approach instead

        // Stop after duration
        setTimeout(() => {
          recorder.stop();
        }, durationMs);

        await recordingDone;

        const blob = new Blob(chunks, { type: 'video/webm' });
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        reject(err.message);
      }
    });
  }, DURATION_MS, WIDTH, HEIGHT);

  // This approach won't work well in headless. Let's use CDP screencast instead.
  await browser.close();

  console.log('  ⚠️  Switching to CDP screenshot approach...');

  // Better approach: use CDP to take rapid JPEG screenshots and build video in-page
  await captureWithScreenshots();
}

async function captureWithScreenshots() {
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: WIDTH, height: HEIGHT },
    args: ['--no-sandbox', '--disable-web-security'],
  });

  const page = await browser.newPage();
  const client = await page.createCDPSession();

  console.log('  📄 Loading page...');
  await page.goto(`file://${HTML_FILE}`, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  console.log('  ✅ Page ready');
  console.log('  🔴 Capturing frames (JPEG, fast mode)...');

  const FPS = 12; // Lower FPS for speed, still smooth enough
  const interval = 1000 / FPS;
  const totalFrames = Math.ceil(DURATION_MS / interval);
  const framesBase64 = [];

  const startTime = Date.now();

  for (let i = 0; i < totalFrames; i++) {
    const frameStart = Date.now();

    // Use CDP for faster screenshots (JPEG, lower quality)
    const { data } = await client.send('Page.captureScreenshot', {
      format: 'jpeg',
      quality: 80,
    });

    framesBase64.push(data);

    if (i % FPS === 0) {
      const sec = Math.floor(i / FPS);
      const total = Math.floor(totalFrames / FPS);
      process.stdout.write(`\r  ⏳ ${sec}/${total}s captured (${framesBase64.length} frames)`);
    }

    // Timing
    const elapsed = Date.now() - frameStart;
    const wait = Math.max(0, interval - elapsed);
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
  }

  console.log(`\n  ✅ ${framesBase64.length} frames captured!`);
  await browser.close();
  console.log('  🔧 Chrome closed');

  // Create assembler HTML
  console.log('  📦 Creating video assembler...');
  createAssembler(framesBase64, FPS);
}

function createAssembler(framesBase64, fps) {
  const assemblerPath = path.resolve(__dirname, 'assemble-video.html');

  // Split frames into chunks to avoid massive string
  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>ECHO. Video Download</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',sans-serif;background:#0f172a;color:white;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;gap:20px}
h1{font-size:28px;background:linear-gradient(135deg,#c084fc,#f472b6);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
#status{color:#94a3b8;font-size:14px}
.bar{width:500px;height:8px;background:#1e293b;border-radius:4px;overflow:hidden}
.fill{height:100%;background:linear-gradient(90deg,#c084fc,#f472b6);width:0%;transition:width 0.2s;border-radius:4px}
canvas{border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.5);max-width:90vw}
.btn{display:none;padding:16px 40px;background:linear-gradient(135deg,#c084fc,#f472b6);color:white;text-decoration:none;border-radius:999px;font-weight:700;font-size:16px;box-shadow:0 8px 30px rgba(192,132,252,0.4);cursor:pointer;border:none;transition:transform 0.2s}
.btn:hover{transform:scale(1.05)}
.info{color:#475569;font-size:12px}
</style></head><body>
<h1>ECHO. Video</h1>
<div id="status">Chargement des frames...</div>
<div class="bar"><div class="fill" id="fill"></div></div>
<canvas id="c" width="${WIDTH}" height="${HEIGHT}" style="width:${Math.min(WIDTH, 960)}px"></canvas>
<a class="btn" id="btn">Telecharger la video (.webm)</a>
<div class="info" id="info"></div>

<script>
const F=${JSON.stringify(framesBase64)};
const FPS=${fps};
const W=${WIDTH},H=${HEIGHT};

async function go(){
  const st=document.getElementById('status'),fl=document.getElementById('fill'),cv=document.getElementById('c'),ctx=cv.getContext('2d'),bt=document.getElementById('btn'),inf=document.getElementById('info');

  st.textContent='Decodage des frames ('+F.length+')...';

  // Decode images
  const imgs=[];
  for(let i=0;i<F.length;i++){
    const img=new Image();
    img.src='data:image/jpeg;base64,'+F[i];
    await new Promise(r=>{img.onload=r;img.onerror=r;});
    imgs.push(img);
    if(i%20===0){fl.style.width=((i/F.length)*40)+'%';st.textContent='Decodage: '+Math.round((i/F.length)*100)+'%';}
  }

  st.textContent='Creation de la video...';
  fl.style.width='40%';

  // Record with MediaRecorder
  const stream=cv.captureStream(FPS);
  const rec=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8',videoBitsPerSecond:6000000});
  const chunks=[];
  rec.ondataavailable=e=>{if(e.data.size>0)chunks.push(e.data);};
  const done=new Promise(r=>{rec.onstop=()=>r();});
  rec.start(50);

  // Play frames
  for(let i=0;i<imgs.length;i++){
    ctx.drawImage(imgs[i],0,0,W,H);
    await new Promise(r=>setTimeout(r,1000/FPS));
    if(i%20===0){fl.style.width=(40+((i/imgs.length)*55))+'%';st.textContent='Encodage video: '+Math.round((i/imgs.length)*100)+'%';}
  }

  rec.stop();
  await done;

  const blob=new Blob(chunks,{type:'video/webm'});
  const url=URL.createObjectURL(blob);
  bt.href=url;
  bt.download='echo-showcase.webm';
  bt.style.display='inline-block';
  fl.style.width='100%';
  const mb=(blob.size/(1024*1024)).toFixed(1);
  st.textContent='Video prete! ('+mb+' MB)';
  inf.textContent=W+'x'+H+' | '+FPS+'fps | '+Math.round(imgs.length/FPS)+'s | WebM VP8';

  // Auto-preview
  ctx.font='20px Segoe UI';
  ctx.fillStyle='rgba(255,255,255,0.5)';
  ctx.textAlign='center';
}

go();
</script></body></html>`;

  fs.writeFileSync(assemblerPath, html);

  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║  ✅ CAPTURE TERMINEE !                    ║');
  console.log('  ╠══════════════════════════════════════════╣');
  console.log('  ║                                          ║');
  console.log('  ║  Ouvre ce fichier dans Chrome:            ║');
  console.log('  ║  assemble-video.html                     ║');
  console.log('  ║                                          ║');
  console.log('  ║  Il va automatiquement:                  ║');
  console.log('  ║  1. Decoder les frames                   ║');
  console.log('  ║  2. Creer la video WebM                  ║');
  console.log('  ║  3. Te donner un bouton TELECHARGER      ║');
  console.log('  ║                                          ║');
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('');

  // Auto-open
  require('child_process').exec(`start "" "${assemblerPath}"`);
}

// Run
captureWithScreenshots().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
