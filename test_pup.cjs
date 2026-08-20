const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Users\\prasa\\.cache\\puppeteer\\chrome\\win64-152.0.7977.42\\chrome-win64\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors']
  });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  console.log("Navigating to http://localhost:5173/rpg.html ...");
  await page.goto('http://localhost:5173/rpg.html', { waitUntil: 'networkidle2' });
  
  console.log("Page loaded. Taking screenshot.");
  await page.screenshot({ path: 'test_screenshot.png' });
  
  await browser.close();
})();
