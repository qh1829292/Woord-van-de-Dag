const { getStore } = require('@netlify/blobs');

exports.handler = async (event, context) => {
  const today = new Date().toISOString().slice(0, 10);
  let recentWords = [];
  let store = null;

  try {
    store = getStore({
      name: 'word-history',
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_AUTH_TOKEN
    });
    const historyRaw = await store.get('recent');
    if (historyRaw) recentWords = JSON.parse(historyRaw);
  } catch (e) {
    recentWords = [];
    store = null;
  }

  const exclusionText = recentWords.length > 0
    ? `Gebruik GEEN van deze woorden, die zijn al recent gebruikt: ${recentWords.join(', ')}.`
    : '';

  const prompt = `Genereer een Nederlands woord op B1 of C1 taalniveau, geschikt voor iemand die zijn woordenschat wil uitbreiden.
Antwoord ALLEEN met dit JSON-object, geen uitleg, geen markdown:
{
  "woord": "...",
  "woordsoort": "...",
  "niveau": "B1" of "B2" of "C1",
  "fonetisch": "...",
  "definitie": "...",
  "voorbeeldzin": "..."
}
Instructies:
- woordsoort: gebruik "zelfstandig naamwoord (de)" of "zelfstandig naamwoord (het)" of "werkwoord" of "bijvoeglijk naamwoord" of "bijwoord" of "voegwoord" etc.
- fonetisch: gebruik IPA-notatie tussen vierkante haken, bijv. [oːvərleːvən]
- definitie: helder, beknopt, 1-2 zinnen
- voorbeeldzin: natuurlijk, modern, illustreert het woord goed
- Kies een woord dat niet te alledaags is, maar ook niet archaisch
- Varieer in woordsoort
- ${exclusionText}`;

  try {
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
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!resp.ok) {
      const data = await resp.json();
      return { statusCode: 500, body: JSON.stringify({ error: `API error: ${resp.status}` }) };
    }

    const data = await resp.json();
    if (data.error) {
      return { statusCode: 500, body: JSON.stringify({ error: data.error.message }) };
    }
    if (!data.content || !data.content[0]) {
      return { statusCode: 500, body: JSON.stringify({ error: 'No content in API response' }) };
    }

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

    const updatedHistory = [json.woord, ...recentWords].slice(0, 30);
    if (store) {
      try {
        await store.set('recent', JSON.stringify(updatedHistory));
      } catch (e) { /* niet kritiek */ }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
