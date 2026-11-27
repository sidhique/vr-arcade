const express = require('express');
const https = require('https');
const fs = require('fs');
const { ExpressPeerServer } = require('peer');
const path = require('path');

const app = express();
const PORT = 3000;

const reloadClients = new Set();
let reloadTimer = null;
const reloadableExtensions = new Set(['.html', '.js', '.css', '.json']);

app.get('/__reload', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive'
  });
  res.write(': connected\n\n');
  reloadClients.add(res);

  res.on('close', () => {
    reloadClients.delete(res);
  });
});

function notifyReload() {
  if (reloadTimer) clearTimeout(reloadTimer);
  reloadTimer = setTimeout(() => {
    reloadTimer = null;
    for (const client of reloadClients) {
      client.write('data: reload\n\n');
    }
  }, 150);
}

function watchForChanges(directory, recursive = false) {
  const watcher = fs.watch(directory, { recursive }, (_eventType, filename) => {
    if (!filename || reloadableExtensions.has(path.extname(filename.toString()).toLowerCase())) {
      notifyReload();
    }
  });
  watcher.on('error', (error) => {
    console.error(`Hot reload watcher error for ${directory}:`, error);
  });
}

watchForChanges(__dirname);
watchForChanges(path.join(__dirname, 'games'), true);

setInterval(() => {
  for (const client of reloadClients) {
    client.write(': keep-alive\n\n');
  }
}, 25000);

app.use(express.static(path.join(__dirname)));

const credentials = {
  key: fs.readFileSync(path.join(__dirname, 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'cert.pem'))
};

const httpsServer = https.createServer(credentials, app);

const peerServer = ExpressPeerServer(httpsServer, {
  path: '/myapp'
});

app.use('/peerjs', peerServer);

httpsServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Local HTTPS VR Arcade running on port ${PORT}`);
});