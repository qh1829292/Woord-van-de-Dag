const { getStore } = require('@netlify/blobs');

// Geeft een Firebase OAuth2 access token terug, met de service-account sleutel
async function getAccessToken() {
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
  const data = await resp.json();
  return data.access_token;
}

async function getTodaysWord() {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      messages: [{ role: 'user', content: 'Genereer een Nederlands woord op B1 of C1 niveau. Antwoord ALLEEN met JSON: {"woord": "...", "definitie": "..."}' }]
    })
  });
  const data = await resp.json();
  const text = data.content[0].text.trim();
  const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
}

exports.handler = async (event) => {
  try {
    const store = getStore({ name: 'push-tokens', consistency: 'strong' });
    const { blobs } = await store.list();

    if (blobs.length === 0) {
      return { statusCode: 200, body: 'Geen tokens om naar te versturen' };
    }

    const word = await getTodaysWord();
    const accessToken = await getAccessToken();
    const projectId = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT).project_id;

    let sent = 0;
    for (const blob of blobs) {
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
                body: `Vandaag: "${word.woord}" — ${word.definitie}`
              },
              webpush: {
                fcm_options: { link: 'https://slimmerwoorden.nl' }
              }
            }
          })
        }
      );
      if (fcmResp.ok) sent++;
    }

    return { statusCode: 200, body: `Verstuurd naar ${sent} van ${blobs.length} apparaten` };
  } catch (e) {
    return { statusCode: 500, body: 'Fout: ' + e.message };
  }
};

exports.config = {
  schedule: '0 5 * * *'
};
