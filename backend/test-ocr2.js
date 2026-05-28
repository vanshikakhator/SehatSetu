require('dotenv').config();
const { GoogleGenAI, Type } = require('@google/genai');

async function test() {
  try {
    const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Create a 1x1 transparent png for test
    const mimeType = 'image/png';
    const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const prompt = `
      Extract the medicines, dosages, and frequencies from the following handwritten prescription image. 
      Return an empty array if you cannot find any medicines.
    `;

    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        prompt,
        { inlineData: { data: base64Data, mimeType: mimeType } }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              dosage: { type: Type.STRING },
              freq: { type: Type.STRING }
            },
            required: ["name", "dosage", "freq"]
          }
        }
      }
    });
    console.log("JSON Output:", response.text);
    console.log("Parsed:", JSON.parse(response.text));
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}
test();
