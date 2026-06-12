import fetch from 'node-fetch';
import readline from 'readline';

const API_KEY = process.env.GOOGLE_API_KEY;
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

if (!API_KEY) {
  console.error('Missing GOOGLE_API_KEY environment variable.');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function generateReply(prompt) {
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
    throw new Error(`API request failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const generated = extractGeneratedText(data);

  if (!generated) {
    const preview = JSON.stringify(data, null, 2).slice(0, 1200);
    throw new Error(`No generated text found in API response. Response preview:\n${preview}`);
  }

  return generated.trim();
}

function extractGeneratedText(data) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const paths = [
    data?.candidates?.[0]?.content?.[0]?.text,
    data?.candidates?.[0]?.output?.[0]?.content?.[0]?.text,
    data?.output?.[0]?.content?.[0]?.text,
  ];

  for (const value of paths) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }

  return findTextValue(data, 'text');
}

function findTextValue(object, keyName) {
  if (typeof object !== 'object' || object === null) {
    return null;
  }

  if (Object.prototype.hasOwnProperty.call(object, keyName)) {
    const value = object[keyName];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }

  for (const key of Object.keys(object)) {
    const value = object[key];
    if (typeof value === 'object' && value !== null) {
      const found = findTextValue(value, keyName);
      if (found) {
        return found;
      }
    } else if (Array.isArray(value)) {
      for (const item of value) {
        const found = findTextValue(item, keyName);
        if (found) {
          return found;
        }
      }
    }
  }

  return null;
}

async function main() {
  console.log('Antigravity Chatbot powered by Google Gemini');

  while (true) {
    const prompt = await ask('\nYou: ');
    if (!prompt || prompt.toLowerCase() === 'exit') {
      console.log('Goodbye.');
      break;
    }

    try {
      const reply = await generateReply(prompt);
      console.log(`Bot: ${reply}`);
    } catch (error) {
      console.error('Error:', error.message);
    }
  }

  rl.close();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
