export async function requestLiveKitToken(fetchImplementation = fetch) {
  let response;
  try {
    response = await fetchImplementation('/api/livekit-token');
  } catch {
    throw new Error('Cannot reach the voice token server. Start it with npm run voice-server.');
  }
  let payload;
  try { payload = await response.json(); }
  catch { payload = {}; }
  if (!response.ok) throw new Error(payload.error || 'The voice token server returned HTTP ' + response.status + '. Check that LIVEKIT_API_KEY and LIVEKIT_API_SECRET are set in .env.');
  if (typeof payload.token !== 'string' || !payload.token || typeof payload.url !== 'string' || !payload.url) {
    throw new Error('The voice token server returned an incomplete response.');
  }
  return payload;
}
