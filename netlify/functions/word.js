const text = data.content[0].text.trim();
    const json = JSON.parse(text.replace(/```json|```/g, '').trim());

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
