{\rtf1\ansi\ansicpg1252\cocoartf2709
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fnil\fcharset0 HelveticaNeue;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\deftab560
\pard\pardeftab560\slleading20\partightenfactor0

\f0\fs26 \cf0 // netlify/functions/get-word.js\
exports.handler = async (event) => \{\
  const today = new Date().toISOString().slice(0, 10);\
\
  const prompt = `Genereer een Nederlands woord op B1 of C1 taalniveau, geschikt voor iemand die zijn woordenschat wil uitbreiden.\
Antwoord ALLEEN met dit JSON-object, geen uitleg, geen markdown:\
\{\
  "woord": "...",\
  "woordsoort": "...",\
  "niveau": "B1" of "B2" of "C1",\
  "fonetisch": "...",\
  "definitie": "...",\
  "voorbeeldzin": "..."\
\}\
\
Instructies:\
- woordsoort: gebruik "zelfstandig naamwoord (de)" of "zelfstandig naamwoord (het)" of "werkwoord" of "bijvoeglijk naamwoord" of "bijwoord" of "voegwoord" etc.\
- fonetisch: gebruik IPA-notatie tussen vierkante haken, bijv. [\uc0\u712 o\u720 v\u601 r\u716 le\u720 v\u601 n]\
- definitie: helder, beknopt, 1\'962 zinnen\
- voorbeeldzin: natuurlijk, modern, illustreert het woord goed\
- Kies een woord dat niet te alledaags is (niet: huis, lopen, groot) maar ook niet archa\'efsch\
- Kies een ander woord dan gisteren of eerder vandaag gegenereerde woorden, varieer in woordsoort`;\
\
  try \{\
    const resp = await fetch('https://api.anthropic.com/v1/messages', \{\
      method: 'POST',\
      headers: \{\
        'Content-Type': 'application/json',\
        'x-api-key': process.env.ANTHROPIC_API_KEY,\
        'anthropic-version': '2023-06-01'\
      \},\
      body: JSON.stringify(\{\
        model: 'claude-sonnet-4-6',\
        max_tokens: 400,\
        messages: [\{ role: 'user', content: prompt \}]\
      \})\
    \});\
\
    const data = await resp.json();\
    if (data.error) \{\
      return \{ statusCode: 500, body: JSON.stringify(\{ error: data.error.message \}) \};\
    \}\
\
    const text = data.content[0].text.trim();\
    const json = JSON.parse(text.replace(/```json|```/g, '').trim());\
\
    const entry = \{\
      date: today,\
      word: json.woord,\
      type: json.woordsoort,\
      level: json.niveau,\
      phonetic: json.fonetisch,\
      definition: json.definitie,\
      example: json.voorbeeldzin\
    \};\
\
    return \{\
      statusCode: 200,\
      headers: \{ 'Content-Type': 'application/json' \},\
      body: JSON.stringify(entry)\
    \};\
  \} catch (e) \{\
    return \{ statusCode: 500, body: JSON.stringify(\{ error: e.message \}) \};\
  \}\
\};}