async function testApi() {
  try {
    const loginRes = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@example.com', password: 'password123' })
    });
    
    console.log('Login Status:', loginRes.status);
    const loginData = await loginRes.json();
    const cookies = loginRes.headers.get('set-cookie');
    
    if (cookies) {
      // Find bob
      const searchRes = await fetch('http://localhost:3000/contact/search?query=bob', {
        headers: { Cookie: cookies }
      });
      const searchData = await searchRes.json();
      const bob = searchData.data[0];

      if (bob) {
        // Send Message
        const msgRes = await fetch(`http://localhost:3000/message/send/${bob.id}`, {
          method: 'POST',
          headers: { 
            Cookie: cookies,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text: 'Hello from Alice!' })
        });
        console.log('Send Message Status:', msgRes.status);
        console.log('Send Message Data:', await msgRes.json());
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testApi().then(() => process.exit(0));
