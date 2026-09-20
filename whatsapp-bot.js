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
  // Last 10 messages matum vachikkalam (memory overload aagama)
  if (history.length > 10) {
    history.shift();
  }
}

require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    protocolTimeout: 60000
  }
});

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`;


// QR code kaatuvom - phone-la scan panna
client.on('qr', (qr) => {
  console.log('QR Code kelambuchu, WhatsApp-la scan pannunga:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('WhatsApp Bot ready! Messages ku wait pannuthu...');
});

client.on('disconnected', (reason) => {
  console.log('Client disconnected:', reason);
});

client.on('auth_failure', (msg) => {
  console.log('Auth failure:', msg);
});

client.on('message_create', (message) => {
  console.log('DEBUG - message_create fired:', message.body, 'from:', message.from);
});

// Yaaravadhu message anuppina, idhu trigger aagum
client.on('message', async (message) => {
  try {
    // Group messages-a ignore pannunga (personal chats matum reply pannum)
       if (message.from.includes('@g.us')) return; // groups ignore
    if (message.from === 'status@broadcast') return; // status updates ignore
    if (message.fromMe) return; // apple sent messages ignore (namma anuppura messages ku bot reply pannama irukka)


    const userId = message.from;
    console.log(`Message vandhuchu (${userId}): ${message.body}`);

    // User message-a history-la add pannunga
    addToHistory(userId, 'user', message.body);

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: getHistory(userId)
      })
    });

    const data = await response.json();

    if (!data.candidates) {
      console.log("API Error:", JSON.stringify(data));
      return;
    }

    const botReply = data.candidates[0].content.parts[0].text;

    // Bot reply-um history-la add pannunga
    addToHistory(userId, 'model', botReply);

    await client.sendMessage(message.from, botReply);

    console.log(`Reply anuppitten: ${botReply}`);

  } catch (error) {
    console.error('Error:', error);
  }
});

client.initialize();