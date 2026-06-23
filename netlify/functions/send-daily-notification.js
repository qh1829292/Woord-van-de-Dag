const { getStore } = require('@netlify/blobs');

async function getAccessToken() {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    const jwtHeader = { alg: 'RS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const jwtClaim = {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    };
    const crypto = require('crypto');
    const base64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
    const toSign = base64url(jwtHeader) + '.' + base64url(jwtClaim);
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(toSign);
    const signature = sign.sign(serviceAccount.private_key, 'base64url');
    const jwt = toSign + '.' + signature;
    
    const resp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=' + jwt
    });
    
    if (!resp.ok) throw new Error('OAuth token request failed: ' + resp.status);
    const data = await resp.json();
    if (data.error) throw new Error('OAuth error: ' + data.error);
    return data.access_token;
  } catch (e) {
    throw new Error('getAccessToken failed: ' + e.message);
  }
}

async function getTodaysWord() {
  try {
    const resp = await fetch('https://slimmerwoorden.nl/.netlify/functions/word', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ force: false })
    });
    
    if (!resp.ok) throw new Error('word function returned ' + resp.status);
    const data = await resp.json();
    if (data.error) throw new Error(data.error);
    return data;
  } catch (e) {
    throw new Error('getTodaysWord failed: ' + e.message);
  }
}

exports.handler = async (event) => {
  try {
    const store = getStore({
      name: 'push-tokens',
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_AUTH_TOKEN
    });
    
    const { blobs } = await store.list();
    if (blobs.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ message: 'Geen tokens' }) };
    }
    
    const word = await getTodaysWord();
    const accessToken = await getAccessToken();
    const projectId = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT).project_id;
    
    let sent = 0;
    for (const blob of blobs) {
      try {
        const tokenData = JSON.parse(await store.get(blob.key));
        const fcmResp = await fetch(
          `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: {
                token: tokenData.token,
                notification: {
                  title: 'SlimmerWoorden.nl',
                  body: `Vandaag: "${word.word}"`
                },
                webpush: {
                  fcm_options: { link: 'https://slimmerwoorden.nl' }
                }
              }
            })
          }
        );
        if (fcmResp.ok) sent++;
      } catch (e) {
        console.error('Send to token ' + blob.key + ' failed:', e.message);
      }
    }
    
    return { statusCode: 200, body: JSON.stringify({ sent, total: blobs.length }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};

exports.config = {
  schedule: '0 5 * * *'
};
