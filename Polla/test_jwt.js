const http = require('http');

const data = JSON.stringify({
  email: 'rafa@lapollavirtual.com',
  password: 'password123'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    try {
      const response = JSON.parse(body);
      if (response.access_token) {
        console.log('✅ Token obtenido.');
        const tokenParts = response.access_token.split('.');
        
        if (tokenParts.length === 3) {
          const payloadBase64 = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
          const payloadBuffer = Buffer.from(payloadBase64, 'base64');
          const payload = JSON.parse(payloadBuffer.toString('utf-8'));
          
          console.log('\n--- Payload JWT ---');
          console.log(JSON.stringify(payload, null, 2));
          console.log('-------------------\n');
          
          if (payload.role) {
            console.log(`✅ ÉXITO [A3]: El JWT contiene el rol definido: ${payload.role}`);
          } else {
            console.log('❌ FALLO [A3]: El campo "role" NO se encontró en el payload JWT.');
          }
        }
      } else {
        console.log('Error: Login no retornó token. Respuesta:', response);
      }
    } catch (e) {
      console.log('Error procesando respuesta:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error(`Error en la petición (Asegúrate de que la API en :3001 esté corriendo): ${e.message}`);
});

req.write(data);
req.end();
