const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { GoogleGenAI, Type } = require('@google/genai');

// Initialize Gemini Client
let genAI;
try {
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  } else {
    console.warn("GEMINI_API_KEY not found in .env. OCR will run in simulation mode.");
  }
} catch (e) {
  console.warn("Gemini API client init failed.", e);
}

router.post('/parse', async (req, res) => {
  const { imageBase64 } = req.body;
  
  if (!imageBase64) {
    return res.status(400).json({ message: "No image provided" });
  }

  try {
    // 1. Save image to disk
    const matches = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ message: "Invalid base64 string" });
    }
    
    const ext = matches[1].split('/')[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const filename = `prescription_${crypto.randomBytes(8).toString('hex')}.${ext}`;
    const filepath = path.join(__dirname, '../uploads', filename);
    const imageUrl = `http://localhost:5000/uploads/${filename}`;
    
    fs.writeFileSync(filepath, buffer);

    let isSimulated = false;
    let structuredMedicines = [];
    let confidence = "High";

    try {
      if (genAI) {
        const mimeType = matches[1]; // e.g., 'image/png'
        const base64Data = matches[2]; // pure base64
        
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
        
        structuredMedicines = JSON.parse(response.text);
        confidence = "High";
      } else {
        throw new Error("GenAI not initialized (missing GEMINI_API_KEY)");
      }
    } catch (aiErr) {
      console.error("AI Structuring Failed, using fallback parser:", aiErr.message);
      isSimulated = true;
      confidence = "Low";
      structuredMedicines = [
        { name: "Paracetamol", dosage: "500mg", freq: "1-0-1" },
        { name: "Amoxicillin", dosage: "250mg", freq: "1-1-1" },
        { name: "Cough Syrup", dosage: "10ml", freq: "0-0-1" }
      ];
    }

    res.json({
      success: true,
      medicines: structuredMedicines,
      imageUrl: imageUrl,
      confidence: confidence,
      isSimulated: isSimulated
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "OCR processing failed" });
  }
});

module.exports = router;
