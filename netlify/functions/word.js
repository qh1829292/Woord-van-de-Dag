exports.handler = async (event) => {
  const today = new Date().toISOString().slice(0, 10);

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
- Varieer in woordsoort`;

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

    const data = await resp.json();
    if (data.error) {
      return { statusCode: 500, body: JSON.stringify({ error: data.error.message }) };
    }

    const text = data.content[0].text.trim();
    const cleaned = text.replace(/json|/g, '').trim();
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

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
