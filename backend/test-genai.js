require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function test() {
  try {
    const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        "What is 2+2?",
      ]
    });
    console.log(response.text);
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}
test();
