/**
 * Test script for the order-notification API endpoint.
 * 
 * Usage:
 * 1. Start your local Vercel dev server:
 *    npx vercel dev
 * 2. Run this script in another terminal:
 *    node test-order-api.js
 * 3. Or, to test against production, export the URL and SECRET:
 *    API_URL=https://your-vercel-domain.vercel.app/api/order-notification AUTH_SECRET=your_real_secret node test-order-api.js
 */

const API_URL = process.env.API_URL || 'http://localhost:3000/api/order-notification';
const AUTH_SECRET = process.env.AUTH_SECRET || 'test-secret-key';

async function testEndpoint() {
  console.log(`Sending test notification to: ${API_URL}`);

  const payload = {
    orderId: "ORD-12345-ABC",
    items: [
      { id: "item_1", name: "Margherita Pizza", quantity: 2, price: 12.50 },
      { id: "item_2", name: "Garlic Bread", quantity: 1, price: 4.00 }
    ],
    totalAmount: 29.00,
    customerContact: {
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+1234567890"
    }
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${AUTH_SECRET}`
      },
      body: JSON.stringify(payload)
    });

    const status = response.status;
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = await response.text();
    }

    console.log(`\nResponse Status: ${status} ${response.statusText}`);
    console.log("Response Body:", data);

    if (status === 200) {
      console.log("\n✅ Test passed! The endpoint processed the notification successfully.");
    } else {
      console.error("\n❌ Test failed! Ensure the Vercel dev server is running and the secret matches.");
    }

  } catch (error) {
    console.error("\n❌ Request failed. Is the server running? Error:", error.message);
  }
}

testEndpoint();
