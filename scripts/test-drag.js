const puppeteer = require('puppeteer');

(async () => {
  const url = 'http://localhost:3000';
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

  await page.goto(url, { waitUntil: 'networkidle2' });

  // Click the Shipping Requests tab
  await page.waitForSelector('#shipping-requests-tab');
  await page.click('#shipping-requests-tab');

  // Wait for Board to render
  await page.waitForSelector('.Board');
  await page.waitForTimeout(500);

  // Find first card in backlog column and the inProgress column
  const columns = await page.$$('.Swimlane-dragColumn');
  if (columns.length < 3) {
    console.error('Expected 3 swimlane columns, found', columns.length);
    await browser.close();
    process.exit(2);
  }

  const backlogCol = columns[0];
  const inProgressCol = columns[1];

  const card = await backlogCol.$('.Card');
  if (!card) {
    console.error('No card found in backlog to drag');
    await browser.close();
    process.exit(2);
  }

  const cardBox = await card.boundingBox();
  const targetBox = await inProgressCol.boundingBox();

  if (!cardBox || !targetBox) {
    console.error('Could not get bounding boxes');
    await browser.close();
    process.exit(2);
  }

  // Perform drag: mouse down on card center, move to target center, mouse up
  const startX = cardBox.x + cardBox.width / 2;
  const startY = cardBox.y + cardBox.height / 2;
  const endX = targetBox.x + targetBox.width / 2;
  const endY = targetBox.y + Math.max(20, targetBox.height / 2);

  const mouse = page.mouse;
  await mouse.move(startX, startY);
  await mouse.down();
  // move in steps to simulate real drag
  const steps = 20;
  for (let i = 1; i <= steps; i++) {
    const nx = startX + (endX - startX) * (i / steps);
    const ny = startY + (endY - startY) * (i / steps);
    await mouse.move(nx, ny);
    await page.waitForTimeout(10);
  }
  await mouse.up();

  // wait for UI to update
  await page.waitForTimeout(500);

  // Check that the card moved into inProgress column and has blue class
  const movedInProgress = await inProgressCol.$('.Card');
  const movedClass = movedInProgress ? await (await movedInProgress.getProperty('className')).jsonValue() : null;

  console.log('Moved card class:', movedClass);

  // Check for white-screen (body background white or body has no children)
  const bodyBg = await page.evaluate(() => {
    const body = document.querySelector('body');
    const style = window.getComputedStyle(body);
    return { bgcolor: style.backgroundColor, childCount: body.childElementCount };
  });
  console.log('Body background and child count:', bodyBg);

  const success = movedInProgress && movedClass && movedClass.indexOf('Card-blue') !== -1;

  await browser.close();
  if (success) {
    console.log('TEST PASSED: card moved and colored blue in In Progress');
    process.exit(0);
  } else {
    console.error('TEST FAILED: card did not move or color did not update');
    process.exit(3);
  }
})();
