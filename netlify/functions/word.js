const { getStore } = require('@netlify/blobs');

function getDateStr() {
  return new Date().toISOString().slice(0, 10);
}

exports.handler = async (event, context) => {
  const today = getDateStr();
  
  try {
    // EERST: Check of woord al voor vandaag in Blobs staat
    const store = getStore({
      name: 'word-of-day',
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_AUTH_TOKEN
    });
    
    try {
      const cached = await store.get(today);
      if (cached) {
        const entry = JSON.parse(cached);
        return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry) };
      }
    } catch (e) { /* niet in cache, genereer nieuw */ }
    
    // TWEEDE: Genereer NIEUW woord
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
        messages: [{ role: 'user', content: 'Genereer een Nederlands woord op B1 of C1 niveau. Antwoord ALLEEN met JSON: {"woord": "...", "woordsoort": "...", "niveau": "B1/B2/C1", "fonetisch": "...", "definitie": "...", "voorbeeldzin": "..."}' }]
      })
    });

    if (!resp.ok) throw new Error('Claude API error: ' + resp.status);
    const data = await resp.json();
    if (data.error) throw new Error(data.error.message);
    if (!data.content || !data.content[0]) throw new Error('No content in response');

    const text = data.content[0].text.trim();
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const json = JSON.parse(cleaned);

    const entry = {
      date: today,
      word: json.woord,
      type: json.woordsoort,
      level: json.niveau,
      phonetic: json.fonetisch,
      definition: json.definitie,
      example: json.voorbeeldzin
    };

    // Sla op in Blobs zodat dit vandaag hetzelfde woord blijft
    try {
      await store.set(today, JSON.stringify(entry));
    } catch (e) { /* niet kritiek */ }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
