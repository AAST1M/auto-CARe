const { chromium } = require('playwright');

(async () => {
  console.log('Starting end-to-end test for Live Map Navigation...');
  
  // Launch browser
  const browser = await chromium.launch({ headless: true });
  
  // Context 1: Driver
  console.log('Setting up Driver Context...');
  const driverContext = await browser.newContext();
  const driverPage = await driverContext.newPage();
  
  // Context 2: User
  console.log('Setting up User Context...');
  const userContext = await browser.newContext();
  const userPage = await userContext.newPage();

  try {
    // 1. Driver signs up
    console.log('Driver: Navigating to login...');
    await driverPage.goto('http://localhost:3000/login');
    
    // Switch to sign up
    await driverPage.click('text="Create an account"');
    
    // Fill out sign up form
    const driverEmail = `driver_${Date.now()}@test.com`;
    await driverPage.fill('input[placeholder="John Doe"]', 'Test Driver');
    await driverPage.fill('input[type="email"]', driverEmail);
    await driverPage.fill('input[type="password"]', 'password123');
    await driverPage.click('button:has-text("Create Account")');
    
    // Select Winch Driver Role
    await driverPage.waitForSelector('text="Winch Driver"');
    await driverPage.click('text="Winch Driver"');
    
    // Fill out Winch Onboarding
    await driverPage.fill('input[placeholder="e.g. ABC 1234"]', 'ABC 1234');
    await driverPage.fill('input[placeholder="14-digit National ID"]', '12345678901234');
    await driverPage.selectOption('select', 'Flatbed');
    await driverPage.click('button:has-text("Complete Setup")');
    
    // Wait for Dashboard to load and go Online
    await driverPage.waitForSelector('text="Winch Command"');
    console.log('Driver: Successfully logged in and on Dashboard.');
    
    // Click the toggle to go online. It's a div, so we find it by the parent text "Offline" or just click the toggle.
    // The text spans have "Offline". Let's click the element next to it.
    await driverPage.click('text="Offline"');
    await driverPage.waitForSelector('text="Online"');
    console.log('Driver: Is now Online.');

    // 2. User signs up
    console.log('User: Navigating to login...');
    await userPage.goto('http://localhost:3000/login');
    await userPage.click('text="Create an account"');
    
    const userEmail = `user_${Date.now()}@test.com`;
    await userPage.fill('input[placeholder="John Doe"]', 'Test User');
    await userPage.fill('input[type="email"]', userEmail);
    await userPage.fill('input[type="password"]', 'password123');
    await userPage.click('button:has-text("Create Account")');
    
    // Select Normal User Role
    await userPage.waitForSelector('text="Car Owner"');
    await userPage.click('text="Car Owner"');
    
    // Fill out User Onboarding
    await userPage.fill('input[placeholder="e.g. Toyota"]', 'Honda');
    await userPage.fill('input[placeholder="e.g. Corolla"]', 'Civic');
    await userPage.fill('input[placeholder="e.g. 2022"]', '2020');
    await userPage.selectOption('select', 'Sedan');
    await userPage.click('button:has-text("Complete Setup")');
    
    console.log('User: Successfully logged in and on Dashboard.');
    
    // 3. User requests a winch
    console.log('User: Requesting Winch...');
    await userPage.click('button:has-text("Request Winch")');
    
    // Wait for the simulated negotiation
    await userPage.waitForSelector('text="Looking for nearby drivers..."');
    console.log('User: Searching for drivers...');
    
    // Wait for offer to appear
    await userPage.waitForSelector('text="Accept Offer"');
    console.log('User: Found a driver offer. Accepting...');
    await userPage.click('button:has-text("Accept Offer")');

    // 4. Map View should appear for User
    console.log('User: Verifying Live Map appears...');
    await userPage.waitForSelector('text="Live Tracking"', { timeout: 5000 });
    console.log('✅ User: Live Map is successfully visible!');

    // 5. Driver accepts request and Map View should appear
    console.log('Driver: Accepting the active request...');
    await driverPage.waitForSelector('button:has-text("Accept")');
    
    // Handle the alert that pops up when driver accepts
    driverPage.on('dialog', async dialog => {
      console.log(`Driver: Dismissing alert -> "${dialog.message()}"`);
      await dialog.accept();
    });
    
    await driverPage.click('button:has-text("Accept")');
    
    console.log('Driver: Verifying Live Navigation map appears...');
    await driverPage.waitForSelector('text="Live Navigation"', { timeout: 5000 });
    console.log('✅ Driver: Live Map is successfully visible!');
    
    console.log('🎉 E2E Navigation Test Passed Successfully!');
  } catch (error) {
    console.error('❌ E2E Test Failed:', error);
  } finally {
    await browser.close();
  }
})();
