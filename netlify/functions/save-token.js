const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { token } = JSON.parse(event.body);
    if (!token) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Geen token meegegeven' }) };
    }

    const store = getStore('push-tokens');
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
