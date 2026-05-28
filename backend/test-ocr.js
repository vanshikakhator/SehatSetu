require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function test() {
  try {
    const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Create a 1x1 transparent png for test
    const mimeType = 'image/png';
    const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const prompt = `
      Extract the medicines, dosages, and frequencies from the following handwritten prescription image. 
      Return ONLY a valid JSON array of objects, with no markdown formatting. 
      Example format: [{"name": "Medicine A", "dosage": "500mg", "freq": "1-0-1"}]
    `;

    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        prompt,
        { inlineData: { data: base64Data, mimeType: mimeType } }
      ]
    });
    console.log(response.text);
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}
test();
