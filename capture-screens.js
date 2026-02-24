const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function captureScreens() {
  console.log('🚀 Lancement du navigateur...');

  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-web-security', '--window-size=1920,1080'],
  });

  const page = await browser.newPage();

  // Load the page
  const htmlPath = path.resolve(__dirname, 'iphone-screens.html');
  console.log('📄 Chargement de la page...');
  await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle0', timeout: 30000 });

  // Wait for fonts and rendering
  await new Promise(r => setTimeout(r, 3000));
  console.log('✅ Page chargée\n');

  const outputDir = path.resolve(__dirname, 'exports');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  // ===== 1. CAPTURE HOME SCREEN iPHONE =====
  console.log('📱 Capture écran d\'accueil iPhone...');

  // Find the first .iphone element
  const phone1 = await page.$$('.iphone');
  if (phone1[0]) {
    const box1 = await phone1[0].boundingBox();
    await page.setViewport({ width: 1920, height: Math.ceil(box1.y + box1.height + 50), deviceScaleFactor: 2 });
    await new Promise(r => setTimeout(r, 500));

    // Recalculate after viewport change
    const box1b = await phone1[0].boundingBox();
    await phone1[0].screenshot({
      path: path.join(outputDir, 'ecran-accueil-iphone.png'),
      type: 'png',
    });
    console.log('  ✅ exports/ecran-accueil-iphone.png');
  }

  // ===== 2. CAPTURE ECHO VOICE SCREEN =====
  console.log('📱 Capture écran dictée vocale ECHO...');

  if (phone1[1]) {
    await phone1[1].screenshot({
      path: path.join(outputDir, 'ecran-dictee-echo.png'),
      type: 'png',
    });
    console.log('  ✅ exports/ecran-dictee-echo.png');
  }

  // ===== 3. GENERATE ECHO LOGO PNG =====
  console.log('🎨 Génération du logo ECHO...');

  // Create a new page for the logo
  const logoPage = await browser.newPage();
  await logoPage.setViewport({ width: 1024, height: 1024, deviceScaleFactor: 1 });

  await logoPage.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@600&display=swap');
        * { margin: 0; padding: 0; }
        body {
          width: 1024px;
          height: 1024px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
        }
        .logo-container {
          width: 1024px;
          height: 1024px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      </style>
    </head>
    <body>
      <div class="logo-container">
        <svg width="1024" height="1024" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="echoCore" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stop-color="#b88bff"/>
              <stop offset="55%" stop-color="#9b5cff"/>
              <stop offset="100%" stop-color="#ff5fb8"/>
            </radialGradient>
            <linearGradient id="echoRing" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#c084fc"/>
              <stop offset="100%" stop-color="#f472b6"/>
            </linearGradient>
            <filter id="echoGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.8" result="blur"/>
              <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.7 0"/>
            </filter>
          </defs>
          <circle cx="60" cy="60" r="52" fill="none" stroke="url(#echoRing)" stroke-width="2.2" opacity="0.45" filter="url(#echoGlow)"/>
          <circle cx="60" cy="60" r="36" fill="none" stroke="url(#echoRing)" stroke-width="2.4" opacity="0.65" filter="url(#echoGlow)"/>
          <circle cx="60" cy="60" r="22" fill="url(#echoCore)" stroke="rgba(255,255,255,0.35)" stroke-width="1"/>
          <text x="60" y="68" text-anchor="middle" font-size="26" font-family="Manrope, sans-serif" font-weight="600" fill="white">E.</text>
        </svg>
      </div>
    </body>
    </html>
  `, { waitUntil: 'networkidle0' });

  await new Promise(r => setTimeout(r, 2000));

  // Logo on transparent background
  await logoPage.screenshot({
    path: path.join(outputDir, 'echo-logo-transparent.png'),
    type: 'png',
    omitBackground: true,
  });
  console.log('  ✅ exports/echo-logo-transparent.png (fond transparent)');

  // Logo as app icon (with gradient background, rounded corners)
  await logoPage.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; }
        body {
          width: 1024px;
          height: 1024px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
        }
        .app-icon {
          width: 1024px;
          height: 1024px;
          border-radius: 224px;
          background: linear-gradient(135deg, #7c3aed 0%, #9b5cff 30%, #c084fc 60%, #f472b6 100%);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .app-icon::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 35% 30%, rgba(255,255,255,0.25), transparent 60%);
        }
        .icon-content {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      </style>
    </head>
    <body>
      <div class="app-icon">
        <div class="icon-content">
          <svg width="800" height="800" viewBox="0 0 120 120" fill="none">
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.2"/>
            <circle cx="60" cy="60" r="36" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1.4"/>
            <text x="60" y="72" text-anchor="middle" font-size="38" font-family="Manrope, sans-serif" font-weight="700" fill="white">E.</text>
          </svg>
        </div>
      </div>
    </body>
    </html>
  `, { waitUntil: 'domcontentloaded' });

  await new Promise(r => setTimeout(r, 1000));

  await logoPage.screenshot({
    path: path.join(outputDir, 'echo-app-icon.png'),
    type: 'png',
    omitBackground: true,
  });
  console.log('  ✅ exports/echo-app-icon.png (icône app style iOS)');

  await logoPage.close();
  await browser.close();

  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  ✅ EXPORT TERMINÉ !                      ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log('║                                          ║');
  console.log('║  📁 echo-app/exports/                    ║');
  console.log('║                                          ║');
  console.log('║  📱 ecran-accueil-iphone.png             ║');
  console.log('║  📱 ecran-dictee-echo.png                ║');
  console.log('║  🎨 echo-logo-transparent.png            ║');
  console.log('║  🎨 echo-app-icon.png                    ║');
  console.log('║                                          ║');
  console.log('╚══════════════════════════════════════════╝');
}

captureScreens().catch(err => {
  console.error('❌ Erreur:', err.message);
  process.exit(1);
});
