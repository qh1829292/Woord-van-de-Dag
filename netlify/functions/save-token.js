const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  const store = getStore({
    name: 'push-tokens',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_AUTH_TOKEN
  });

  if (event.httpMethod === 'DELETE') {
    try {
      const { token } = JSON.parse(event.body);
      if (!token) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Geen token meegegeven' }) };
      }
      await store.delete(token);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true })
      };
    } catch (e) {
      return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
    }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { token } = JSON.parse(event.body);
    if (!token) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Geen token meegegeven' }) };
    }

    await store.set(token, JSON.stringify({ token, savedAt: new Date().toISOString() }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
