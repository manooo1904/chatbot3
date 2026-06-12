import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const API_KEY = process.env.GOOGLE_API_KEY;
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';
const PORT = process.env.PORT || 5002;
const __dirname = dirname(fileURLToPath(import.meta.url));

if (!API_KEY) {
  console.error('Missing GOOGLE_API_KEY environment variable.');
  process.exit(1);
}

const app = express();
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

app.post('/api/generate', async (req, res) => {
  const prompt = req.body?.prompt;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Missing prompt in request body.' });
  }

  const body = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `API request failed: ${errText}` });
    }

    const data = await response.json();
    const generated = extractGeneratedText(data);

    if (!generated) {
      return res.status(502).json({
        error: 'No generated text found in API response.',
        response: data,
      });
    }

    return res.json({ reply: generated.trim() });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message });
  }
});

const server = app.listen(PORT, () => {
  console.log(`Antigravity Chatbot running at http://localhost:${PORT}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Set a different port with the PORT environment variable, for example: PORT=5001 npm start`);
  } else {
    console.error('Server error:', error);
  }
  process.exit(1);
});

function extractGeneratedText(data) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const candidates = data?.candidates;
  if (Array.isArray(candidates)) {
    for (const candidate of candidates) {
      const text = findTextValue(candidate, 'text');
      if (text) {
        return text;
      }
    }
  }

  const text = findTextValue(data, 'text');
  return text;
}

function findTextValue(value, keyName) {
  if (typeof value === 'string') {
    return value.trim() || null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findTextValue(item, keyName);
      if (found) {
        return found;
      }
    }
    return null;
  }

  if (typeof value !== 'object' || value === null) {
    return null;
  }

  if (Object.prototype.hasOwnProperty.call(value, keyName)) {
    return findTextValue(value[keyName], keyName);
  }

  for (const key of Object.keys(value)) {
    const found = findTextValue(value[key], keyName);
    if (found) {
      return found;
    }
  }

  return null;
}
