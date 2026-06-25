const http = require('http');

const API_BASE = 'http://localhost:5001/api';

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING END-TO-END INTEGRATION TESTS ---');

  // 1. Register a new user
  console.log('\n[1] Registering a new user...');
  const uniqueEmail = `user_${Date.now()}@example.com`;
  const regRes = await request(`${API_BASE}/auth/register`, {
    method: 'POST',
    body: {
      email: uniqueEmail,
      password: 'password123',
      name: 'Integration Test User',
      phone: '1234567890',
      role: 'USER'
    }
  });

  if (regRes.status !== 200 || !regRes.body.token) {
    console.error('Registration failed:', regRes.body);
    process.exit(1);
  }
  console.log('Success! User registered. ID:', regRes.body.user.id);
  const userToken = regRes.body.token;

  // 1b. Attempt duplicate registration
  console.log('\n[1b] Attempting duplicate registration (should fail)...');
  const duplicateRegRes = await request(`${API_BASE}/auth/register`, {
    method: 'POST',
    body: {
      email: uniqueEmail,
      password: 'password123',
      name: 'Integration Test User',
      phone: '1234567890',
      role: 'USER'
    }
  });

  if (duplicateRegRes.status !== 400) {
    console.error('Duplicate registration check failed:', duplicateRegRes.body);
    process.exit(1);
  }
  console.log('Success! Duplicate registration rejected.');

  // 2. Login the registered user
  console.log('\n[2] Logging in the registered user...');
  const loginRes = await request(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: {
      email: uniqueEmail,
      password: 'password123'
    }
  });

  if (loginRes.status !== 200 || !loginRes.body.token) {
    console.error('Login failed:', loginRes.body);
    process.exit(1);
  }
  console.log('Success! Logged in.');

  // 3. Retrieve user profile via /me
  console.log('\n[3] Fetching user profile via /me...');
  const meRes = await request(`${API_BASE}/auth/me`, {
    headers: { 'Authorization': `Bearer ${userToken}` }
  });

  if (meRes.status !== 200 || meRes.body.email !== uniqueEmail) {
    console.error('Fetch profile failed:', meRes.body);
    process.exit(1);
  }
  console.log('Success! Retrieved profile. Name:', meRes.body.name);

  // 4. Book an appointment at workshop '1' (Vision Motors)
  console.log('\n[4] Booking an appointment at workshop 1...');
  const bookRes = await request(`${API_BASE}/workshops/1/book`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${userToken}` },
    body: {
      serviceType: 'General Inspection',
      time: 'Wed 14 - 10:00 AM',
      carDetails: 'BMW 320i',
      price: 450
    }
  });

  if (bookRes.status !== 200 || !bookRes.body.id) {
    console.error('Booking failed:', bookRes.body);
    process.exit(1);
  }
  const appointmentId = bookRes.body.id;
  console.log('Success! Appointment created. ID:', appointmentId);

  // 5. Fetch user's appointments
  console.log('\n[5] Fetching user appointments...');
  const userAppts = await request(`${API_BASE}/workshops/appointments`, {
    headers: { 'Authorization': `Bearer ${userToken}` }
  });

  if (userAppts.status !== 200 || userAppts.body.length === 0) {
    console.error('Fetching user appointments failed:', userAppts.body);
    process.exit(1);
  }
  console.log('Success! User has', userAppts.body.length, 'appointment(s).');

  // 6. Log in as workshop owner
  console.log('\n[6] Logging in as workshop owner...');
  const ownerLogin = await request(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: {
      email: 'owner@example.com',
      password: 'password123'
    }
  });

  if (ownerLogin.status !== 200 || !ownerLogin.body.token) {
    console.error('Owner login failed:', ownerLogin.body);
    process.exit(1);
  }
  const ownerToken = ownerLogin.body.token;
  console.log('Success! Owner logged in.');

  // 7. Fetch workshop incoming appointments
  console.log('\n[7] Fetching workshop appointments...');
  const ownerAppts = await request(`${API_BASE}/workshops/appointments`, {
    headers: { 'Authorization': `Bearer ${ownerToken}` }
  });

  if (ownerAppts.status !== 200 || ownerAppts.body.length === 0) {
    console.error('Fetching workshop appointments failed:', ownerAppts.body);
    process.exit(1);
  }
  console.log('Success! Workshop has', ownerAppts.body.length, 'incoming appointment(s).');

  // 8. Update appointment status to 'Confirmed'
  console.log('\n[8] Updating appointment status to "Confirmed"...');
  const updateRes = await request(`${API_BASE}/workshops/appointments/${appointmentId}`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${ownerToken}` },
    body: { status: 'Confirmed' }
  });

  if (updateRes.status !== 200 || updateRes.body.status !== 'Confirmed') {
    console.error('Updating appointment status failed:', updateRes.body);
    process.exit(1);
  }
  console.log('Success! Status updated.');

  // 9. Re-verify status as user
  console.log('\n[9] Re-verifying appointment status as user...');
  const userAppts2 = await request(`${API_BASE}/workshops/appointments`, {
    headers: { 'Authorization': `Bearer ${userToken}` }
  });

  const verifiedAppt = userAppts2.body.find(a => a.id === appointmentId);
  if (!verifiedAppt || verifiedAppt.status !== 'Confirmed') {
    console.error('Status verification failed:', verifiedAppt);
    process.exit(1);
  }
  console.log('Success! User sees status as:', verifiedAppt.status);

  console.log('\n--- ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ---');
}

runTests().catch(console.error);
