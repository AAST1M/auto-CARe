const http = require('http');

async function run() {
  try {
    // 1. Create a unique user
    const email = `testuser_${Date.now()}@example.com`;
    const password = "Password123";
    
    let res = await fetch('http://localhost:5001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role: 'USER' })
    });
    let data = await res.json();
    console.log("Register:", data);

    // 2. Login
    res = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    data = await res.json();
    const token = data.token;
    console.log("Login token:", token ? "Got token" : "Failed");

    // 3. Get workshops
    res = await fetch('http://localhost:5001/api/workshops');
    const workshops = await res.json();
    const workshopId = workshops[0]?.id;
    console.log("First workshop ID:", workshopId);

    if (!workshopId) {
      console.log("No workshops found!");
      return;
    }

    // 4. Book Appointment (Cash)
    res = await fetch(`http://localhost:5001/api/workshops/${workshopId}/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        serviceType: 'General Inspection',
        time: 'Mon 12 - 09:00 AM',
        carDetails: 'Test Car',
        price: 450,
        paymentMethod: 'cash'
      })
    });
    console.log("Booking response status:", res.status);
    data = await res.json();
    console.log("Booking response data:", data);

  } catch(e) {
    console.error("Test failed:", e);
  }
}
run();
