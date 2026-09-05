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

// =========================
// Express App
// =========================

const app = express();


// =========================
// Image Upload
// =========================

const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 10 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {

        if (
            file.mimetype === "image/jpeg" ||
            file.mimetype === "image/png" ||
            file.mimetype === "image/webp"
        ) {
            cb(null, true);
        } else {
            cb(
                new Error(
                    "Only JPG, PNG and WEBP images are supported."
                )
            );
        }
    }
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

    const models = [
        "gemini-3.6-flash",
        "gemini-3.5-flash-lite"
    ];

    let lastError;

    for (const model of models) {

        console.log(
            `Trying model: ${model}`
        );

        for (let attempt = 1; attempt <= 2; attempt++) {

            try {

                console.log(
                    `Attempt ${attempt}/2 using ${model}`
                );

                const response =
                    await ai.models.generateContent({

                        model: model,

                        contents: contents,

                        config: {
                            responseMimeType:
                                "application/json"
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
                    Number(
                        error?.status ||
                        error?.code ||
                        0
                    );

                console.log(
                    `Model ${model} failed:`,
                    message
                );


                // =========================
                // Quota / Rate Limit
                // =========================

                if (
                    status === 429 ||
                    message.includes("429") ||
                    message.includes("RESOURCE_EXHAUSTED") ||
                    message.toLowerCase().includes("quota")
                ) {

                    console.log(
                        `Quota/rate limit reached for ${model}`
                    );

                    // Don't retry the same exhausted request
                    break;
                }


                // =========================
                // Temporary Server Error
                // =========================

                const isTemporaryError =
                    status === 503 ||
                    message.includes("503") ||
                    message.includes("UNAVAILABLE") ||
                    message.toLowerCase().includes(
                        "high demand"
                    );


                if (!isTemporaryError) {

                    throw error;

                }


                // =========================
                // Controlled Retry
                // =========================

                if (attempt < 2) {

                    const waitTime = 3000;

                    console.log(
                        `Temporary error. Retrying in ${waitTime / 1000}s...`
                    );

                    await new Promise(
                        resolve =>
                            setTimeout(
                                resolve,
                                waitTime
                            )
                    );

                }

            }

        }

        console.log(
            `${model} unavailable. Trying next model...`
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

            // =========================
            // Check Image
            // =========================

            if (!req.file) {

                return res.status(400).json({

                    error:
                        "Please upload an onion image."

                });

            }


            // =========================
            // Convert Image to Base64
            // =========================

            const base64Image =
                req.file.buffer.toString("base64");


            // =========================
            // Short AI Prompt
            // =========================

            const prompt = `
You are an onion quality assessment AI.

Analyze the provided image and assess the visible onions.

Return ONLY valid JSON.
No markdown.
No explanation outside JSON.

Use exactly:

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

- qualityScore: 0-100
- grade: only A, B, C or D
- gradeAPercentage: estimated percentage suitable for Grade A
- ursPercentage: estimated percentage of undersized onions
- size: size quality score 0-100
- color: color quality score 0-100
- visibleDefects: defect-free quality score 0-100
- uniformity: uniformity score 0-100
- defects: array of visible defect names
- If no visible defects, use []
- recommendation: short procurement recommendation

Check:
size, color, uniformity, damaged onions, rotten onions,
sprouted onions, undersized onions and overall quality.

Return only the JSON object.
`;


            // =========================
            // Gemini Analysis
            // =========================

            const response =
                await generateWithRetry([

                    {
                        inlineData: {

                            mimeType:
                                req.file.mimetype,

                            data:
                                base64Image

                        }
                    },

                    {
                        text: prompt
                    }

                ]);


            // =========================
            // Read AI Response
            // =========================

            let text =
                response.text.trim();


            // Remove accidental markdown
            text = text
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim();


            // =========================
            // Parse JSON
            // =========================

            const result =
                JSON.parse(text);


            // =========================
            // Save Assessment
            // =========================

            const assessment =
                new Assessment({

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
                        Number(
                            result.qualityScore
                        ) || 0,

                    grade:
                        result.grade || "",

                    gradeAPercentage:
                        Number(
                            result.gradeAPercentage
                        ) || 0,

                    ursPercentage:
                        Number(
                            result.ursPercentage
                        ) || 0,

                    size:
                        Number(
                            result.size
                        ) || 0,

                    color:
                        Number(
                            result.color
                        ) || 0,

                    visibleDefects:
                        Number(
                            result.visibleDefects
                        ) || 0,

                    uniformity:
                        Number(
                            result.uniformity
                        ) || 0,

                    defects:
                        Array.isArray(
                            result.defects
                        )
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
            // Send Result
            // =========================

            return res.json({

                ...result,

                assessmentId:
                    assessment.assessmentId

            });


        } catch (error) {

            console.error(
                "Final Gemini Error:",
                error
            );


            const message =
                error?.message || "";

            const status =
                Number(
                    error?.status ||
                    error?.code ||
                    0
                );


            // =========================
            // Quota / Rate Limit Error
            // =========================

            if (
                status === 429 ||
                message.includes("429") ||
                message.includes("RESOURCE_EXHAUSTED") ||
                message.toLowerCase().includes("quota")
            ) {

                return res.status(429).json({

                    error:
                        "AI request limit reached. Please try again later."

                });

            }


            // =========================
            // Temporary Gemini Error
            // =========================

            if (
                status === 503 ||
                message.includes("503") ||
                message.includes("UNAVAILABLE")
            ) {

                return res.status(503).json({

                    error:
                        "AI service is temporarily busy. Please try again."

                });

            }


            // =========================
            // Invalid AI JSON
            // =========================

            if (
                error instanceof SyntaxError
            ) {

                return res.status(502).json({

                    error:
                        "AI returned an invalid analysis. Please try again."

                });

            }


            // =========================
            // Upload Error
            // =========================

            if (
                message.includes(
                    "Only JPG, PNG and WEBP"
                )
            ) {

                return res.status(400).json({

                    error:
                        "Please upload a JPG, PNG or WEBP image."

                });

            }


            // =========================
            // File Too Large
            // =========================

            if (
                error?.code === "LIMIT_FILE_SIZE"
            ) {

                return res.status(400).json({

                    error:
                        "Image is too large. Please upload an image below 10 MB."

                });

            }


            // =========================
            // Generic Error
            // =========================

            return res.status(500).json({

                error:
                    "AI analysis failed. Please try again."

            });

        }

    }
);


// =========================
// Assessment History API
// =========================

app.get(
    "/assessments",

    async (req, res) => {

        try {

            const assessments =
                await Assessment
                    .find()
                    .sort({
                        createdAt: -1
                    });

            res.json(
                assessments
            );

        } catch (error) {

            console.error(
                "History Error:",
                error
            );

            res.status(500).json({

                error:
                    "Failed to fetch assessments"

            });

        }

    }
);


// =========================
// Render Port
// =========================

const PORT =
    process.env.PORT || 5000;


app.listen(
    PORT,

    () => {

        console.log(
            `OnionIQ Backend running on port ${PORT}`
        );

    }
);