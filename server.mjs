import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import express from 'express';
import { AccessToken } from 'livekit-server-sdk';

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/api/livekit-token', async (_request, response) => {
  const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
  const apiSecret = process.env.LIVEKIT_API_SECRET || 'secret';
  const url = process.env.LIVEKIT_URL || 'ws://localhost:7880';

  const identity = 'vaayu-' + randomUUID();
  const roomName = 'vaayu-room-' + randomUUID();

  try {
    const accessToken = new AccessToken(apiKey, apiSecret, { identity, ttl: '15m' });
    accessToken.addGrant({ roomJoin: true, room: roomName });
    const token = await accessToken.toJwt();
    return response.json({ token, url });
  } catch (error) {
    console.error('Could not create a LiveKit token:', error);
    return response.status(500).json({ error: error.message || 'Could not create a LiveKit token.' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log('Vaayu token server listening on http://localhost:' + port);
});
