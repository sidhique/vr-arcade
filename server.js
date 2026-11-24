const express = require('express');
const https = require('https');
const fs = require('fs');
const { ExpressPeerServer } = require('peer');
const path = require('path');

const app = express();
const PORT = 3000;

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