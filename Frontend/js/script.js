// ==========================================
// ONIONIQ - MAIN JAVASCRIPT
// AUTO ONION SCAN + CAMERA + GALLERY + GEMINI AI
// ==========================================


// ==========================================
// ELEMENTS
// ==========================================

const imageInput = document.getElementById("imageInput");
const imageName = document.getElementById("imageName");

const galleryInput = document.getElementById("galleryInput");

const cameraModal = document.getElementById("cameraModal");
const cameraVideo = document.getElementById("cameraVideo");
const cameraCanvas = document.getElementById("cameraCanvas");


// ==========================================
// VARIABLES
// ==========================================

let cameraStream = null;
let currentImageFile = null;

let scanTimer = null;
let detectionTimer = null;

let isCapturing = false;


// ==========================================
// OLD IMAGE INPUT
// ==========================================

if (imageInput) {

    imageInput.addEventListener("change", function () {

        if (this.files && this.files.length > 0) {

            currentImageFile = this.files[0];

            if (imageName) {

                imageName.textContent =
                    "Selected: " + this.files[0].name;

            }

            showImagePreview(this.files[0]);

        }

    });

}


// ==========================================
// OPEN CAMERA
// ==========================================

async function openCamera() {

    if (!cameraModal || !cameraVideo) {

        alert("Camera section nahi mila.");

        return;

    }


    // Check browser camera support

    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
    ) {

        alert(
            "Is browser me camera support nahi hai."
        );

        return;

    }


    try {

        // Stop previous camera if running

        closeCamera();


        // Start camera

        cameraStream =
            await navigator.mediaDevices.getUserMedia({

                video: {

                    facingMode: {
                        ideal: "environment"
                    },

                    width: {
                        ideal: 1280
                    },

                    height: {
                        ideal: 720
                    }

                },

                audio: false

            });


        // Connect camera to video

        cameraVideo.srcObject =
            cameraStream;


        // Show modal

        cameraModal.style.display =
            "flex";


        cameraVideo.style.display =
            "block";


        await cameraVideo.play();


        // Reset capture state

        isCapturing = false;


        // Hide manual capture button

        const captureButton =
            document.querySelector(".capture-btn");


        if (captureButton) {

            captureButton.style.display =
                "none";

        }


        // Show scanning message

        showScanningMessage();


        // Start automatic scan

        startAutomaticScan();

    }


    catch (error) {

        console.error(
            "Camera Error:",
            error
        );


        if (
            error.name ===
            "NotAllowedError"
        ) {

            alert(
                "Camera permission denied hai. Browser me Camera permission Allow karo."
            );

        }


        else if (
            error.name ===
            "NotFoundError"
        ) {

            alert(
                "Camera nahi mila."
            );

        }


        else if (
            error.name ===
            "NotReadableError"
        ) {

            alert(
                "Camera kisi aur application me use ho raha hai. Zoom, Teams ya dusre camera apps band karo."
            );

        }


        else {

            alert(
                "Camera open nahi ho paya. Browser permission aur camera settings check karo."
            );

        }

    }

}


// ==========================================
// SCANNING MESSAGE
// ==========================================

function showScanningMessage() {

    let oldMessage =
        document.getElementById(
            "scanStatus"
        );


    if (oldMessage) {

        oldMessage.remove();

    }


    const message =
        document.createElement(
            "div"
        );


    message.id =
        "scanStatus";


    message.innerHTML = `

        <div style="
            margin-top:10px;
            padding:10px;
            text-align:center;
            font-size:14px;
            color:#555;
        ">

            🔍 Scanning onion...

            <br>

            <small>
                Onion ko camera ke saamne stable rakhein
            </small>

        </div>

    `;


    const cameraBox =
        document.querySelector(
            ".camera-box"
        );


    if (cameraBox) {

        cameraBox.appendChild(
            message
        );

    }

}


// ==========================================
// UPDATE SCAN MESSAGE
// ==========================================

function updateScanMessage(text) {

    const status =
        document.getElementById(
            "scanStatus"
        );


    if (status) {

        status.innerHTML = `

            <div style="
                margin-top:10px;
                padding:10px;
                text-align:center;
                font-size:14px;
                color:#555;
            ">

                ${text}

            </div>

        `;

    }

}


// ==========================================
// START AUTOMATIC SCAN
// ==========================================

function startAutomaticScan() {

    stopAutomaticScan();


    // Camera ko settle hone ka time

    scanTimer =
        setTimeout(
            function () {

                detectOnion();

            },
            1500
        );

}


// ==========================================
// DETECT ONION
// ==========================================

function detectOnion() {

    if (
        !cameraVideo ||
        !cameraCanvas ||
        !cameraStream ||
        isCapturing
    ) {

        return;

    }


    const width =
        cameraVideo.videoWidth;


    const height =
        cameraVideo.videoHeight;


    // Camera ready nahi hai

    if (
        !width ||
        !height
    ) {

        scanTimer =
            setTimeout(
                detectOnion,
                500
            );

        return;

    }


    // Small canvas for detection

    const scanWidth =
        160;


    const scanHeight =
        Math.round(
            height *
            (
                scanWidth /
                width
            )
        );


    cameraCanvas.width =
        scanWidth;


    cameraCanvas.height =
        scanHeight;


    const ctx =
        cameraCanvas.getContext(
            "2d",
            {
                willReadFrequently:
                    true
            }
        );


    ctx.drawImage(

        cameraVideo,

        0,
        0,

        scanWidth,
        scanHeight

    );


    const imageData =
        ctx.getImageData(

            0,
            0,

            scanWidth,
            scanHeight

        );


    const data =
        imageData.data;


    let onionPixels =
        0;


    let totalPixels =
        0;


    // ======================================
    // SIMPLE ONION COLOR DETECTION
    // ======================================

    for (
        let i = 0;
        i < data.length;
        i += 16
    ) {

        const r =
            data[i];


        const g =
            data[i + 1];


        const b =
            data[i + 2];


        // Ignore dark pixels

        if (
            r < 35 &&
            g < 35 &&
            b < 35
        ) {

            continue;

        }


        totalPixels++;


        // Onion-like warm colors

        const warmColor =

            (

                r > g * 1.10 &&

                r > b * 1.15

            )

            ||

            (

                r > 100 &&

                g > 70 &&

                b < 90

            )

            ||

            (

                r > 130 &&

                g > 100 &&

                b < 100

            );


        if (warmColor) {

            onionPixels++;

        }

    }


    const percentage =

        totalPixels > 0

            ?

            onionPixels /
            totalPixels

            :

            0;


    console.log(

        "Onion detection:",

        Math.round(
            percentage * 100
        ) + "%"

    );


    // ======================================
    // ONION DETECTED
    // ======================================

    if (
        percentage > 0.12
    ) {

        updateScanMessage(
            "🧅 Onion detected! Hold still..."
        );


        // Automatically capture after 1.5 sec

        detectionTimer =
            setTimeout(
                function () {

                    if (
                        !isCapturing
                    ) {

                        captureAutomatically();

                    }

                },
                1500
            );

    }


    else {

        updateScanMessage(
            "🔍 Looking for onion..."
        );


        // Continue scanning

        scanTimer =
            setTimeout(
                detectOnion,
                500
            );

    }

}


// ==========================================
// AUTOMATIC CAPTURE
// ==========================================

function captureAutomatically() {

    if (
        !cameraVideo ||
        !cameraCanvas ||
        !cameraStream ||
        isCapturing
    ) {

        return;

    }


    isCapturing =
        true;


    stopAutomaticScan();


    updateScanMessage(
        "📸 Capturing onion image..."
    );


    const width =
        cameraVideo.videoWidth;


    const height =
        cameraVideo.videoHeight;


    if (
        !width ||
        !height
    ) {

        isCapturing =
            false;

        return;

    }


    // Full resolution

    cameraCanvas.width =
        width;


    cameraCanvas.height =
        height;


    const context =
        cameraCanvas.getContext(
            "2d"
        );


    context.drawImage(

        cameraVideo,

        0,
        0,

        width,
        height

    );


    // Convert camera image to JPG

    cameraCanvas.toBlob(

        function (blob) {

            if (!blob) {

                alert(
                    "Image capture nahi ho payi."
                );


                isCapturing =
                    false;


                return;

            }


            // Create File

            const file =
                new File(

                    [blob],

                    "onion-auto-scan.jpg",

                    {
                        type:
                            "image/jpeg"
                    }

                );


            currentImageFile =
                file;


            // Close camera

            closeCamera();


            // Show captured image

            showImagePreview(
                file
            );

        },

        "image/jpeg",

        0.90

    );

}


// ==========================================
// CLOSE CAMERA
// ==========================================

function closeCamera() {

    stopAutomaticScan();


    if (cameraStream) {

        cameraStream
            .getTracks()
            .forEach(
                function (track) {

                    track.stop();

                }
            );


        cameraStream =
            null;

    }


    if (cameraVideo) {

        cameraVideo.srcObject =
            null;

    }


    if (cameraModal) {

        cameraModal.style.display =
            "none";

    }


    isCapturing =
        false;

}


// ==========================================
// STOP AUTOMATIC SCAN
// ==========================================

function stopAutomaticScan() {

    if (scanTimer) {

        clearTimeout(
            scanTimer
        );

        scanTimer =
            null;

    }


    if (detectionTimer) {

        clearTimeout(
            detectionTimer
        );

        detectionTimer =
            null;

    }

}


// ==========================================
// MANUAL CAPTURE SUPPORT
// ==========================================

function captureImage() {

    captureAutomatically();

}


// ==========================================
// OPEN GALLERY
// ==========================================

function openGallery() {

    if (!galleryInput) {

        alert(
            "Gallery input nahi mila."
        );

        return;

    }


    galleryInput.click();

}

// ==========================================
// AUTOMATIC BATCH ID GENERATOR
// ==========================================

function generateBatchId() {

    const year = new Date().getFullYear();

    let batchNumber =
        parseInt(
            localStorage.getItem("onioniqBatchNumber") || "0"
        );

    batchNumber++;

    localStorage.setItem(
        "onioniqBatchNumber",
        batchNumber
    );

    const formattedNumber =
        String(batchNumber).padStart(4, "0");

    return `ON-${year}-${formattedNumber}`;
}


// ==========================================
// SET BATCH ID
// ==========================================

function setAutomaticBatchId() {

    const batchIdElement =
        document.getElementById("batchId");

    if (!batchIdElement) {
        return;
    }

    // Only generate if empty
    if (!batchIdElement.value.trim()) {

        batchIdElement.value =
            generateBatchId();

    }

}


// ==========================================
// RUN WHEN PAGE LOADS
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        setAutomaticBatchId();

    }
);


// ==========================================
// GALLERY IMAGE
// ==========================================

if (galleryInput) {

    galleryInput.addEventListener(

        "change",

        function () {

            if (
                this.files &&
                this.files.length > 0
            ) {

                currentImageFile =
                    this.files[0];


                showImagePreview(
                    this.files[0]
                );

            }

        }

    );

}


// ==========================================
// IMAGE PREVIEW
// ==========================================

function showImagePreview(file) {

    const preview =
        document.getElementById(
            "imagePreview"
        );


    if (
        !preview ||
        !file
    ) {

        return;

    }


    const imageURL =
        URL.createObjectURL(
            file
        );


    preview.innerHTML = `

        <div class="preview-content">

            <img

                src="${imageURL}"

                alt="Scanned Onion"

                class="preview-image"

            >


            <p
                style="
                    color:#159447;
                    font-weight:600;
                    margin:10px 0;
                "
            >

                ✅ Onion image captured successfully

            </p>


            <button

                type="button"

                class="analyze-btn"

                onclick="analyzeCapturedImage()"

            >

                🤖 Analyze with AI

            </button>

        </div>

    `;

}


// ==========================================
// SCROLL TO ASSESSMENT
// ==========================================

function scrollToAssessment() {

    const assessment =
        document.getElementById(
            "assessment"
        );


    if (assessment) {

        assessment.scrollIntoView({

            behavior:
                "smooth"

        });

    }

}


// ==========================================
// DEMO BUTTON
// ==========================================

function showDemo() {

    alert(

        "Scan an onion. OnionIQ will automatically capture the image and analyze it with AI."

    );

}


// ==========================================
// ANALYZE BUTTON
// ==========================================

function analyzeImage() {

    analyzeCapturedImage();

}


// ==========================================
// REAL GEMINI AI ANALYSIS
// ==========================================

async function analyzeCapturedImage() {

    // ======================================
    // GET FORM VALUES
    // ======================================

    const farmerName =
        document.getElementById(
            "farmerName"
        )?.value.trim() || "";


    const batchId =
        document.getElementById(
            "batchId"
        )?.value.trim() || "";


    const quantity =
        document.getElementById(
            "quantity"
        )?.value.trim() || "";


    const location =
        document.getElementById(
            "location"
        )?.value.trim() || "";


    // ======================================
    // VALIDATE FORM
    // ======================================

    if (
        !farmerName ||
        !batchId ||
        !quantity ||
        !location
    ) {

        alert(
            "Please fill all batch details first."
        );

        return;

    }


    // ======================================
    // VALIDATE IMAGE
    // ======================================

    if (!currentImageFile) {

        alert(
            "Please scan or select an onion image."
        );

        return;

    }


    // ======================================
    // RESULT PANEL
    // ======================================

    const resultPanel =
        document.getElementById(
            "resultPanel"
        );


    if (resultPanel) {

        resultPanel.innerHTML = `

            <div class="result-placeholder">

                <div class="big-icon">
                    🤖
                </div>

                <h3>
                    AI is analyzing...
                </h3>

                <p>
                    OnionIQ is analyzing your onion image.
                    Please wait...
                </p>

            </div>

        `;

    }


    try {

        // ==================================
        // CREATE FORMDATA
        // ==================================

        const formData =
            new FormData();


        // Image

        formData.append(

            "image",

            currentImageFile

        );


        // Farmer details

        formData.append(

            "farmerName",

            farmerName

        );


        formData.append(

            "batchId",

            batchId

        );


        formData.append(

            "quantity",

            quantity

        );


        formData.append(

            "location",

            location

        );


        // ==================================
        // SEND TO NODE BACKEND
        // ==================================

        const response =
            await fetch(

                "https://onioniq-vvar.onrender.com/analyze-onion",

                {

                    method:
                        "POST",

                    body:
                        formData

                }

            );


        // ==================================
        // GET JSON
        // ==================================

        const data =
            await response.json();


        console.log(
            "Gemini AI Response:",
            data
        );


        // ==================================
        // CHECK ERROR
        // ==================================

        if (!response.ok) {

            throw new Error(

                data.error ||

                data.details ||

                "AI analysis failed."

            );

        }


        // ==================================
        // SHOW REAL AI RESULT
        // ==================================

        showAIResult(

            data,

            batchId

        );

    }


    catch (error) {

        console.error(

            "AI Analysis Error:",

            error

        );


        if (resultPanel) {

            resultPanel.innerHTML = `

                <div class="result-placeholder">

                    <div class="big-icon">
                        ⚠️
                    </div>


                    <h3>
                        Analysis Failed
                    </h3>


                    <p>
                        ${error.message}
                    </p>


                    <button

                        type="button"

                        class="analyze-btn"

                        onclick="analyzeCapturedImage()"

                    >

                        🔄 Try Again

                    </button>

                </div>

            `;

        }

    }

}


// ==========================================
// SHOW REAL AI RESULT
// ==========================================

function showAIResult(
    data,
    batchId
) {

    const resultPanel =
        document.getElementById(
            "resultPanel"
        );


    if (!resultPanel) {

        return;

    }


    // ======================================
    // SAFE VALUES
    // ======================================

    const qualityScore =
        Number(
            data.qualityScore
        ) || 0;


    const grade =
        data.grade ||
        "N/A";


    const gradeAPercentage =
        Number(
            data.gradeAPercentage
        ) || 0;


    const ursPercentage =
        Number(
            data.ursPercentage
        ) || 0;


    const size =
        Number(
            data.size
        ) || 0;


    const color =
        Number(
            data.color
        ) || 0;


    const visibleDefects =
        Number(
            data.visibleDefects
        ) || 0;


    const uniformity =
        Number(
            data.uniformity
        ) || 0;


    const recommendation =
        data.recommendation ||
        "No recommendation available.";


    // ======================================
    // DEFECTS
    // ======================================

    let defectsHTML =
        "";


    if (
        Array.isArray(
            data.defects
        ) &&
        data.defects.length > 0
    ) {

        defectsHTML = `

            <div
                style="
                    margin-top:20px;
                    padding:15px;
                    background:#fff7f0;
                    border-radius:10px;
                "
            >

                <strong>
                    Detected Defects
                </strong>

                <ul
                    style="
                        margin-top:10px;
                        padding-left:20px;
                        color:#555;
                    "
                >

                    ${data.defects
                        .map(
                            defect =>
                                `<li>${defect}</li>`
                        )
                        .join("")}

                </ul>

            </div>

        `;

    }


    else {

        defectsHTML = `

            <div
                style="
                    margin-top:20px;
                    padding:15px;
                    background:#f0f7f0;
                    border-radius:10px;
                "
            >

                <strong>
                    Detected Defects
                </strong>

                <p
                    style="
                        margin-top:8px;
                        color:#159447;
                    "
                >

                    No major visible defects detected.

                </p>

            </div>

        `;

    }


    // ======================================
    // RESULT HTML
    // ======================================

    resultPanel.innerHTML = `

        <div class="result-content">

            <h3>
                🤖 AI Assessment Result
            </h3>


            <p
                style="
                    margin:15px 0;
                    color:#777;
                "
            >

                Batch:
                <strong>
                    ${escapeHTML(batchId)}
                </strong>

            </p>


            <!-- QUALITY SCORE -->

            <div class="score">

                ${qualityScore}

            </div>


            <p>
                Quality Score
            </p>


            <!-- GRADE -->

            <div class="grade">

                Grade ${escapeHTML(grade)}

            </div>


            <!-- GRADE A + URS -->

            <div
                style="
                    display:grid;
                    grid-template-columns:1fr 1fr;
                    gap:12px;
                    margin:20px 0;
                "
            >

                <div
                    style="
                        padding:15px;
                        background:#f0f7f0;
                        border-radius:10px;
                        text-align:center;
                    "
                >

                    <strong>
                        Grade A
                    </strong>

                    <div
                        style="
                            font-size:24px;
                            font-weight:700;
                            margin-top:5px;
                        "
                    >

                        ${gradeAPercentage}%

                    </div>

                </div>


                <div
                    style="
                        padding:15px;
                        background:#fff7f0;
                        border-radius:10px;
                        text-align:center;
                    "
                >

                    <strong>
                        URS
                    </strong>

                    <div
                        style="
                            font-size:24px;
                            font-weight:700;
                            margin-top:5px;
                        "
                    >

                        ${ursPercentage}%

                    </div>

                </div>

            </div>


            <!-- SIZE -->

            ${createQualityItem(
                "Size",
                size
            )}


            <!-- COLOR -->

            ${createQualityItem(
                "Color",
                color
            )}


            <!-- VISIBLE DEFECTS -->

            ${createQualityItem(
                "Visible Defects",
                visibleDefects
            )}


            <!-- UNIFORMITY -->

            ${createQualityItem(
                "Uniformity",
                uniformity
            )}


            <!-- DEFECTS -->

            ${defectsHTML}


            <!-- RECOMMENDATION -->

            <div
                style="
                    margin-top:20px;
                    padding:15px;
                    background:#f0f7f0;
                    border-radius:10px;
                "
            >

                <strong>
                    Recommendation
                </strong>

                <p
                    style="
                        margin-top:8px;
                        color:#555;
                        line-height:1.5;
                    "
                >

                    ${escapeHTML(
                        recommendation
                    )}

                </p>

            </div>


            <!-- NEW ASSESSMENT -->

            <button

                type="button"

                class="analyze-btn"

                onclick="location.reload()"

                style="
                    margin-top:20px;
                "

            >

                🔄 New Assessment

            </button>

        </div>

    `;


    // IMPORTANT:
    // No scrollIntoView here.
    // Result will stay in the right-side panel.

}


// ==========================================
// QUALITY ITEM
// ==========================================

function createQualityItem(
    title,
    percentage
) {

    const value =
        Math.max(
            0,
            Math.min(
                100,
                Number(
                    percentage
                ) || 0
            )
        );


    return `

        <div class="quality-item">

            <div class="quality-header">

                <span>
                    ${title}
                </span>

                <strong>
                    ${value}%
                </strong>

            </div>


            <div class="progress">

                <div
                    class="progress-bar"
                    style="
                        width:${value}%
                    "
                ></div>

            </div>

        </div>

    `;

}


// ==========================================
// HTML ESCAPE
// ==========================================

function escapeHTML(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// ==========================================
// ESC KEY
// ==========================================

document.addEventListener(

    "keydown",

    function (event) {

        if (
            event.key ===
            "Escape"
        ) {

            closeCamera();

        }

    }

);


// ==========================================
// PAGE CLOSE
// ==========================================

window.addEventListener(

    "beforeunload",

    function () {

        if (cameraStream) {

            cameraStream
                .getTracks()
                .forEach(
                    function (track) {

                        track.stop();

                    }
                );

        }

    }

);