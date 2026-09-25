require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Chat history store panna (memory-la, per user)
const chatHistory = {};

function getHistory(userId) {
  if (!chatHistory[userId]) {
    chatHistory[userId] = [];
  }
  return chatHistory[userId];
}

function addToHistory(userId, role, text) {
  const history = getHistory(userId);
  history.push({ role, parts: [{ text }] });
  if (history.length > 10) {
    history.shift();
  }
}

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    protocolTimeout: 60000
  }
});

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`;

client.on('qr', (qr) => {
  console.log('=================================');
  console.log('QR Code kelambuchu, WhatsApp-la scan pannunga:');
  console.log('=================================');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ WhatsApp Bot ready! Messages ku wait pannuthu...');
});

client.on('disconnected', (reason) => {
  console.log('❌ Client disconnected:', reason);
});

client.on('auth_failure', (msg) => {
  console.log('❌ Auth failure:', msg);
});

// Gemini API call pannura function, retry logic vechu
async function askGemini(userId, userMessage, retries = 2) {
  addToHistory(userId, 'user', userMessage);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: getHistory(userId) })
      });

      const data = await response.json();

      if (data.candidates) {
        const botReply = data.candidates[0].content.parts[0].text;
        addToHistory(userId, 'model', botReply);
        return botReply;
      }

      // 503 (server busy) na, konjam wait pannitu retry pannunga
      if (data.error && data.error.code === 503 && attempt < retries) {
        console.log(`Server busy, retry pannuren (attempt ${attempt + 1})...`);
        await new Promise(r => setTimeout(r, 3000));
        continue;
      }

      console.log('API Error:', JSON.stringify(data));
      return "Sorry, konjam busy-ah irukken. Konja neram kalichi try pannunga.";

    } catch (err) {
      console.error('Fetch error:', err);
      if (attempt === retries) {
        return "Sorry, connection error. Try again pannunga.";
      }
    }
  }
}

client.on('message', async (message) => {
  try {
    // Groups, status, self-sent messages ellam ignore pannunga
    if (message.from.includes('@g.us')) return;
    if (message.from === 'status@broadcast') return;
    if (message.fromMe) return;

    // Empty messages (reactions, calls, media without caption) ignore pannunga
    if (!message.body || message.body.trim() === '') return;

    const userId = message.from;
    console.log(`📩 Message vandhuchu (${userId}): ${message.body}`);

    const botReply = await askGemini(userId, message.body);

    await client.sendMessage(message.from, botReply);
    console.log(`✅ Reply anuppitten: ${botReply}`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
});

client.initialize();
