const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema(
    {
        assessmentId: {
            type: String,
            required: true,
            unique: true
        },

        farmerName: {
            type: String,
            default: ""
        },

        batchId: {
            type: String,
            default: ""
        },

        quantity: {
            type: String,
            default: ""
        },

        location: {
            type: String,
            default: ""
        },

        imageName: {
            type: String,
            default: ""
        },

        qualityScore: {
            type: Number,
            default: 0
        },

        grade: {
            type: String,
            default: ""
        },

        gradeAPercentage: {
            type: Number,
            default: 0
        },

        ursPercentage: {
            type: Number,
            default: 0
        },

        size: {
            type: Number,
            default: 0
        },

        color: {
            type: Number,
            default: 0
        },

        visibleDefects: {
            type: Number,
            default: 0
        },

        uniformity: {
            type: Number,
            default: 0
        },

        defects: {
            type: [String],
            default: []
        },

        recommendation: {
            type: String,
            default: ""
        },

        status: {
            type: String,
            default: "Completed"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "Assessment",
    assessmentSchema
);