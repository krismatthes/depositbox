const { spawn } = require('child_process');

console.log('Starting API...');
const api = spawn('npx', ['tsx', 'src/index.ts'], {
  stdio: 'pipe',
  env: { ...process.env, PORT: '3005' }
});

api.stdout.on('data', (data) => {
  console.log(`API: ${data}`);
});

api.stderr.on('data', (data) => {
  console.error(`API Error: ${data}`);
});

api.on('close', (code) => {
  console.log(`API exited with code ${code}`);
});
