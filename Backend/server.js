const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const mongoose = require("mongoose");
const { GoogleGenAI } = require("@google/genai");
const Assessment = require("./models/assessment");

dotenv.config();

// =========================
// MongoDB Connection
// =========================

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected Successfully");
    })
    .catch((error) => {
        console.error(
            "MongoDB Connection Error:",
            error.message
        );
    });

const app = express();

const upload = multer({
    storage: multer.memoryStorage()
});

app.use(cors());
app.use(express.json());


// =========================
// Gemini AI
// =========================

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


// =========================
// Retry + Fallback Function
// =========================

async function generateWithRetry(contents) {

    // Primary + fallback models
    const models = [
        "gemini-3.6-flash",
        "gemini-3.5-flash-lite"
    ];

    let lastError;

    for (const model of models) {

        console.log(`Trying model: ${model}`);

        for (let attempt = 1; attempt <= 3; attempt++) {

            try {

                console.log(
                    `Attempt ${attempt}/3 using ${model}`
                );

                const response = await ai.models.generateContent({
                    model: model,

                    contents: contents,

                    config: {
                        responseMimeType: "application/json"
                    }
                });

                console.log(
                    `Success with model: ${model}`
                );

                return response;

            } catch (error) {

                lastError = error;

                const message =
                    error?.message || "";

                const status =
                    error?.status ||
                    error?.code ||
                    "";

                const isTemporaryError =
                    status === 503 ||
                    message.includes("503") ||
                    message.includes("UNAVAILABLE") ||
                    message.includes("high demand");

                console.log(
                    `Model ${model} failed:`,
                    message
                );

                // Non-503 error
                if (!isTemporaryError) {
                    throw error;
                }

                // Retry only if attempts remain
                if (attempt < 3) {

                    const waitTime =
                        5000 * Math.pow(2, attempt - 1);

                    console.log(
                        `Retrying in ${waitTime / 1000} seconds...`
                    );

                    await new Promise(resolve =>
                        setTimeout(resolve, waitTime)
                    );
                }
            }
        }

        console.log(
            `${model} unavailable. Trying fallback model...`
        );
    }

    throw lastError;
}


// =========================
// Onion Analysis API
// =========================

app.post(
    "/analyze-onion",
    upload.single("image"),
    async (req, res) => {

        try {

            // Check image
            if (!req.file) {

                return res.status(400).json({
                    error: "No onion image received"
                });

            }


            // Convert image to Base64
            const base64Image =
                req.file.buffer.toString("base64");


            // =========================
            // AI Prompt
            // =========================

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

4. gradeAPercentage means the estimated percentage
   of onions suitable for Grade A.

5. ursPercentage means the estimated percentage
   of onions that are undersized.

6. size represents size quality.

7. color represents color quality.

8. visibleDefects represents freedom from visible defects.

9. uniformity represents uniformity of the onions.

10. defects must be an array containing detected
    defect names.

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


            // =========================
            // Send to Gemini
            // =========================

            const response =
                await generateWithRetry([

                    {
                        inlineData: {
                            mimeType: req.file.mimetype,
                            data: base64Image
                        }
                    },

                    {
                        text: prompt
                    }

                ]);


            // =========================
            // Read AI response
            // =========================

            let text =
                response.text.trim();


            // Remove markdown if Gemini adds it
            text = text
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim();


            // Convert JSON text to object
            const result =
                JSON.parse(text);


            // =========================
// Save Assessment to MongoDB
// =========================

const assessment = new Assessment({

    assessmentId:
        "OA-" + Date.now(),

    farmerName:
        req.body.farmerName || "",

    batchId:
        req.body.batchId || "",

    quantity:
        req.body.quantity || "",

    location:
        req.body.location || "",

    imageName:
        req.file.originalname || "",

    qualityScore:
        Number(result.qualityScore) || 0,

    grade:
        result.grade || "",

    gradeAPercentage:
        Number(result.gradeAPercentage) || 0,

    ursPercentage:
        Number(result.ursPercentage) || 0,

    size:
        Number(result.size) || 0,

    color:
        Number(result.color) || 0,

    visibleDefects:
        Number(result.visibleDefects) || 0,

    uniformity:
        Number(result.uniformity) || 0,

    defects:
        Array.isArray(result.defects)
            ? result.defects
            : [],

    recommendation:
        result.recommendation || "",

    status:
        "Completed"
});

await assessment.save();

console.log(
    "Assessment saved:",
    assessment.assessmentId
);


// =========================
// Send result to frontend
// =========================

res.json({
    ...result,
    assessmentId: assessment.assessmentId
});


        } catch (error) {

            console.error(
                "Final Gemini Error:",
                error
            );

            res.status(500).json({

                error: "AI analysis failed",

                details:
                    error?.message ||
                    "Unknown AI error"

            });

        }
    }
);

// =========================
// Assessment History API
// =========================

app.get("/assessments", async (req, res) => {

    try {

        const assessments =
            await Assessment
                .find()
                .sort({ createdAt: -1 });

        res.json(assessments);

    } catch (error) {

        console.error(
            "History Error:",
            error
        );

        res.status(500).json({
            error: "Failed to fetch assessments"
        });
    }
});

// =========================
// Render Port
// =========================

const PORT =
    process.env.PORT || 5000;


app.listen(PORT, () => {

    console.log(
        `OnionIQ Backend running on port ${PORT}`
    );

});