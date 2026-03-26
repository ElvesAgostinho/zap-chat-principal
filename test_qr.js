const fs = require('fs');

async function testConnection() {
  const url = "https://lzjbdoeufeyqrijfazoc.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6amJkb2V1ZmV5cXJpamZhem9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjI0MjYsImV4cCI6MjA4MzAzODQyNn0.y1-o8TrYHHJ9Eu0bdDhpS5Ia4n18GckB4prKEHnYIy4";

  try {
    // 1. Get a store
    const storeRes = await fetch(`${url}/rest/v1/lojas?select=id,nome,instance_name&limit=1`, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    const stores = await storeRes.json();
    
    if (!stores || stores.length === 0) {
      console.log("No stores found.");
      return;
    }
    
    const store = stores[0];
    console.log(`Testing with store: ${store.nome} (${store.id}), Instance: ${store.instance_name}`);

    // 2. Call Edge Function
    const fnRes = await fetch(`${url}/functions/v1/whatsapp-connection`, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'generate_qrcode',
        instance: store.instance_name,
        store_id: store.id
      })
    });

    const fnStatus = fnRes.status;
    const fnText = await fnRes.text();
    console.log(`\nEdge Function Status: ${fnStatus}`);
    
    try {
      console.log("Response JSON:");
      console.log(JSON.stringify(JSON.parse(fnText), null, 2));
    } catch {
      console.log("Response Text:");
      console.log(fnText);
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

testConnection();
