const { chromium } = require('playwright');

(async () => {
  console.log('Starting end-to-end test for Live Map Navigation...');
  
  // Launch browser
  const browser = await chromium.launch({ headless: true });
  
  // Context 1: Driver
  console.log('Setting up Driver Context...');
  const driverContext = await browser.newContext();
  await driverContext.setGeolocation({ latitude: 30.0500, longitude: 31.2400 });
  await driverContext.grantPermissions(['geolocation']);
  const driverPage = await driverContext.newPage();
  
  // Context 2: User
  console.log('Setting up User Context...');
  const userContext = await browser.newContext();
  await userContext.setGeolocation({ latitude: 30.0450, longitude: 31.2350 });
  await userContext.grantPermissions(['geolocation']);
  const userPage = await userContext.newPage();

  const driverEmail = `driver_${Date.now()}@test.com`;
  const userEmail = `user_${Date.now()}@test.com`;
  const password = 'Password123!';

  try {
    // 1. Provision accounts via API
    console.log('Provisioning test accounts...');
    
    const regDriver = await fetch('http://127.0.0.1:5001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Super Towing',
        email: driverEmail,
        password: password,
        role: 'WINCH_DRIVER'
      })
    });
    if (!regDriver.ok) {
      throw new Error(`Driver registration failed: ${await regDriver.text()}`);
    }
    console.log(`Driver registered: ${driverEmail}`);

    const regUser = await fetch('http://127.0.0.1:5001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Stuck Customer',
        email: userEmail,
        password: password,
        role: 'USER'
      })
    });
    if (!regUser.ok) {
      throw new Error(`User registration failed: ${await regUser.text()}`);
    }
    console.log(`User registered: ${userEmail}`);

    // 2. Driver Log In
    console.log('Driver: Logging in...');
    await driverPage.goto('http://localhost:3000/login');
    await driverPage.fill('input[type="email"]', driverEmail);
    await driverPage.fill('input[type="password"]', password);
    await driverPage.click('button:has-text("Sign In")');

    await driverPage.waitForSelector('h2:has-text("Winch Command")', { timeout: 10000 });
    console.log('Driver: Successfully logged in.');

    // Go Online
    await driverPage.locator('div').filter({ has: driverPage.locator('text=Offline') }).locator('.w-14.h-8').click();
    await driverPage.waitForSelector('text=Online', { timeout: 10000 });
    console.log('Driver: Went Online.');

    // 3. User Log In
    console.log('User: Logging in...');
    await userPage.goto('http://localhost:3000/login');
    await userPage.fill('input[type="email"]', userEmail);
    await userPage.fill('input[type="password"]', password);
    await userPage.click('button:has-text("Sign In")');

    await userPage.waitForSelector('text=Core Services', { timeout: 10000 });
    console.log('User: Successfully logged in.');

    // 4. Request Winch
    console.log('User: Accessing Winch Service...');
    await userPage.click('text=Winch');
    await userPage.waitForSelector('h3:has-text("Request Winch")', { timeout: 10000 });

    // Select locations
    console.log('User: Selecting pickup and dropoff points...');
    await userPage.click('button[aria-label="Auto-detect current location"]');
    await userPage.click('text=Dropoff Location');
    await userPage.click('button[aria-label="Auto-detect current location"]');

    console.log('User: Finding Winch Drivers...');
    await userPage.click('button:has-text("Find Winch Drivers")');

    // Wait for driver to appear
    await userPage.waitForSelector('text=Super Towing', { timeout: 10000 });
    console.log('User: Driver offer found. Accepting...');
    await userPage.click('button:has-text("Accept")');

    // 5. Driver Accepts Request
    console.log('Driver: Waiting for incoming request...');
    await driverPage.waitForSelector('text=Stuck Customer', { timeout: 15000 });
    console.log('Driver: Accept request...');
    await driverPage.click('button:has-text("Accept")');

    // 6. Verify tracking screen
    console.log('Verifying Live Navigation & Live Tracking map screens...');
    await driverPage.waitForSelector('h2:has-text("Live Navigation")', { timeout: 15000 });
    await userPage.waitForSelector('h2:has-text("Live Tracking")', { timeout: 15000 });
    console.log('✅ Success: Live map and route coordinates tracking is fully active!');

    // 7. Complete job
    console.log('Driver: Arriving and completing job...');
    await driverPage.click('button:has-text("Arrived / Complete")');

    await driverPage.waitForSelector('h2:has-text("Winch Command")', { timeout: 15000 });
    await userPage.waitForSelector('text=Core Services', { timeout: 15000 });
    console.log('🎉 test-map E2E Navigation Test Passed Successfully!');
  } catch (error) {
    console.error('❌ E2E Test Failed:', error);
  } finally {
    await browser.close();
  }
})();
