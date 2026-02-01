
const net = require('net');

const targets = [
  { host: 'smtp.gmail.com', port: 465 },
  { host: 'smtp.gmail.com', port: 587 },
  { host: 'smtp.googlemail.com', port: 465 },
  { host: 'google.com', port: 80 }
];

async function testConnection(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = 5000;
    
    socket.setTimeout(timeout);
    
    socket.on('connect', () => {
      console.log(`✅ ${host}:${port} - Connected!`);
      socket.destroy();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      console.log(`❌ ${host}:${port} - Timeout (${timeout}ms)`);
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', (err) => {
      console.log(`❌ ${host}:${port} - Error: ${err.message}`);
      socket.destroy();
      resolve(false);
    });
    
    socket.connect(port, host);
  });
}

async function run() {
  console.log('--- Network Diagnosis ---');
  for (const t of targets) {
    await testConnection(t.host, t.port);
  }
}

run();
