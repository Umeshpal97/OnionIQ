const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const { GoogleGenAI } = require("@google/genai");

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

app.post("/analyze-onion", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: "No onion image received"
            });
        }

        const base64Image = req.file.buffer.toString("base64");

const prompt = `
You are an onion quality assessment AI.

Analyze the provided onion image carefully.

Return ONLY valid JSON.
Do NOT use markdown.
Do NOT write any explanation outside JSON.

Use this exact structure:

{
  "qualityScore": 0,
  "grade": "A",
  "gradeAPercentage": 0,
  "ursPercentage": 0,
  "size": 0,
  "color": 0,
  "visibleDefects": 0,
  "uniformity": 0,
  "defects": [],
  "recommendation": ""
}

Rules:

1. All percentage values must be numbers between 0 and 100.
2. qualityScore must be a number between 0 and 100.
3. grade must be one of:
   "A", "B", "C", "D"
4. gradeAPercentage means the estimated percentage of onions suitable for Grade A.
5. ursPercentage means the estimated percentage of onions that are undersized.
6. size represents size quality.
7. color represents color quality.
8. visibleDefects represents freedom from visible defects.
9. uniformity represents uniformity of the onions.
10. defects must be an array containing detected defect names.
11. If no defect is visible, return an empty array.
12. recommendation should be a short procurement recommendation.

Assess:
- Onion size
- Color
- Visible defects
- Uniformity
- Damaged onions
- Rotten onions
- Sprouted onions
- Undersized onions
- Overall quality

Return only the JSON object.
`;

        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: [
                {
                    inlineData: {
                        mimeType: req.file.mimetype,
                        data: base64Image
                    }
                },
                {
                    text: prompt
                }
            ]
        });

        let text = response.text.trim();

        // Remove ```json if Gemini adds it
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

        const result = JSON.parse(text);

        res.json(result);

    } catch (error) {
        console.error("Gemini Error:", error);

        res.status(500).json({
            error: "AI analysis failed",
            details: error.message
        });
    }
});

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`OnionIQ Backend running on http://localhost:${PORT}`);
});