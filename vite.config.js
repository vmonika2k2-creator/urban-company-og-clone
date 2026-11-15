import { defineConfig, loadEnv } from 'vite';
import { randomUUID } from 'node:crypto';
import { AccessToken } from 'livekit-server-sdk';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      port: 4173,
      strictPort: false,
    },
    plugins: [
      {
        name: 'livekit-token-middleware',
        configureServer(server) {
          server.middlewares.use('/api/livekit-token', async (req, res) => {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');

            const apiKey = env.LIVEKIT_API_KEY || process.env.LIVEKIT_API_KEY || 'devkey';
            const apiSecret = env.LIVEKIT_API_SECRET || process.env.LIVEKIT_API_SECRET || 'secret';
            const url = env.LIVEKIT_URL || process.env.LIVEKIT_URL || 'ws://localhost:7880';

            try {
              const identity = 'vaayu-' + randomUUID();
              const roomName = 'vaayu-room-' + randomUUID();
              const accessToken = new AccessToken(apiKey, apiSecret, { identity, ttl: '15m' });
              accessToken.addGrant({ roomJoin: true, room: roomName });
              const token = await accessToken.toJwt();
              res.statusCode = 200;
              res.end(JSON.stringify({ token, url }));
            } catch (error) {
              console.error('Failed to create LiveKit token in Vite middleware:', error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: error.message || 'Could not create LiveKit token.' }));
            }
          });
        },
      },
    ],
  };
});
