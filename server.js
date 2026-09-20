require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`;

app.post('/chat', async (req, res) => {
  try {
    const userMessage = req.body.message;

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userMessage }] }]
      })
    });

        const data = await response.json();
    console.log("Gemini response:", JSON.stringify(data, null, 2));

    if (!data.candidates) {
      return res.json({ reply: "API Error: " + JSON.stringify(data.error || data) });
    }

    const botReply = data.candidates[0].content.parts[0].text;
    res.json({ reply: botReply });

  } catch (error) {
    console.error(error);
    res.status(500).json({ reply: "Sorry, error vandhirikku. Try again pannunga." });
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
