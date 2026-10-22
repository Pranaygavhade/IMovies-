process.env.NODE_ENV = 'test';
process.env.PORT = '5055';

const puppeteer = require('puppeteer-core');
const { startServer } = require('../server');
const Movie = require('../models/Movie');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 5055;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function run() {
  console.log('🚀 Starting in-process IMovies Server for browser verification...');

  // Start the Express server on port 5055
  const { httpServer } = await startServer();
  await new Promise((resolve) => {
    if (httpServer.listening) {
      resolve();
    } else {
      httpServer.listen(PORT, resolve);
    }
  });

  console.log(`🌐 Server listening at ${BASE_URL}`);

  // Fetch a sample movie directly from DB
  const sampleMovie = (await Movie.findOne({ status: 'now_showing' })) || (await Movie.findOne());
  if (!sampleMovie) {
    throw new Error('No movies found in database.');
  }
  console.log(`🎬 Target Movie for Details test: "${sampleMovie.title}" (${sampleMovie._id})`);

  console.log('\n🌐 Launching Microsoft Edge via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const pagesToTest = [
    { name: 'Home Page', path: '/' },
    { name: 'Movies Listing Page', path: '/movies' },
    { name: 'Login Page', path: '/login' },
    { name: 'Movie Details Page', path: `/movies/${sampleMovie._id}` },
  ];

  let anyErrors = false;

  for (const pageInfo of pagesToTest) {
    console.log(`\n--------------------------------------------------`);
    console.log(`🔍 Testing: ${pageInfo.name} (${pageInfo.path})`);

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    const consoleErrors = [];
    const uncaughtExceptions = [];

    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        consoleErrors.push(text);
      }
    });

    page.on('pageerror', (err) => {
      uncaughtExceptions.push(err.message);
    });

    try {
      const response = await page.goto(`${BASE_URL}${pageInfo.path}`, {
        waitUntil: 'networkidle0',
        timeout: 25000,
      });

      console.log(`   HTTP Status: ${response.status()}`);

      // Allow 1.5s for initial React render & animations
      await new Promise((r) => setTimeout(r, 1500));

      // 1. Verify ErrorBoundary did not catch any rendering error
      const errorBoundaryTriggered = await page.evaluate(() => {
        const text = document.body.innerText;
        return text.includes('Something Went Wrong') && text.includes('Reload Page');
      });

      if (errorBoundaryTriggered) {
        const errDetails = await page.evaluate(() => {
          const card = document.querySelector('.card');
          return card ? card.innerText : 'Unknown ErrorBoundary render';
        });
        uncaughtExceptions.push(`ErrorBoundary displayed: ${errDetails}`);
      }

      // 2. Verify key DOM element mounted
      const pageHeading = await page.evaluate(() => {
        const h1 = document.querySelector('h1');
        const h2 = document.querySelector('h2');
        const nav = document.querySelector('nav');
        return {
          h1: h1 ? h1.innerText : null,
          h2: h2 ? h2.innerText : null,
          hasNavbar: !!nav,
          bodySnippet: document.body.innerText.slice(0, 100).replace(/\n/g, ' '),
        };
      });

      console.log(`   DOM Status: Navbar=${pageHeading.hasNavbar}, Snippet: "${pageHeading.bodySnippet}..."`);

      const totalErrors = [...consoleErrors, ...uncaughtExceptions];

      if (totalErrors.length === 0) {
        console.log(`   ✅ PASS: ${pageInfo.name} rendered cleanly with 0 console errors.`);
      } else {
        console.error(`   ❌ FAIL: ${pageInfo.name} encountered errors:`);
        totalErrors.forEach((err) => console.error(`      - ${err}`));
        anyErrors = true;
      }
    } catch (err) {
      console.error(`   ❌ Navigation / Render Error: ${err.message}`);
      anyErrors = true;
    } finally {
      await page.close();
    }
  }

  await browser.close();

  // Close HTTP Server
  await new Promise((resolve) => httpServer.close(resolve));
  console.log(`\n==================================================`);

  if (!anyErrors) {
    console.log(`🎉 ALL 4 PAGES (Home, Movies, Login, Movie Details) RENDERED WITH ZERO CONSOLE ERRORS!`);
    process.exit(0);
  } else {
    console.error(`💥 One or more pages failed.`);
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
