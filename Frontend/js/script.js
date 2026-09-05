// ==========================================
// ONIONIQ - MAIN JAVASCRIPT
// ONE JS FILE FOR ALL PAGES
// ==========================================


// ==========================================
// GLOBAL VARIABLES
// ==========================================

let cameraStream = null;
let currentImageFile = null;

let scanTimer = null;
let detectionTimer = null;

let isCapturing = false;


// ==========================================
// PAGE ELEMENTS
// ==========================================

const imageInput =
    document.getElementById("imageInput");

const imageName =
    document.getElementById("imageName");

const galleryInput =
    document.getElementById("galleryInput");

const cameraModal =
    document.getElementById("cameraModal");

const cameraVideo =
    document.getElementById("cameraVideo");

const cameraCanvas =
    document.getElementById("cameraCanvas");


// ==========================================
// PAGE LOAD
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        setupNavigation();

        setupAssessment();

        setAutomaticBatchId();

    }
);


function setupNavigation() {

    const menuButton =
        document.querySelector(".menu-btn");

    const closeButton =
        document.querySelector(".close-menu");

    const overlay =
        document.getElementById("menuOverlay");


    console.log("OnionIQ Navigation Loaded");


    // ======================================
    // HAMBURGER
    // ======================================

    if (menuButton) {

        menuButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                toggleMenu();

            }
        );

    }


    // ======================================
    // CLOSE BUTTON
    // ======================================

    if (closeButton) {

        closeButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                closeMenu();

            }
        );

    }


    // ======================================
    // OVERLAY
    // ======================================

    if (overlay) {

        overlay.addEventListener(
            "click",
            function () {

                closeMenu();

            }
        );

    }


    // ======================================
    // MENU LINKS
    // ======================================

    const menuLinks =
        document.querySelectorAll(
            ".menu-links a"
        );


    menuLinks.forEach(
        function (link) {

            link.addEventListener(
                "click",
                function () {

                    closeMenu();

                }
            );

        }
    );

}

//  Toggle Menu

function toggleMenu() {

    const menu =
        document.getElementById("sideMenu");

    const overlay =
        document.getElementById("menuOverlay");


    if (!menu || !overlay) {

        console.error(
            "Side menu elements not found"
        );

        return;

    }


    menu.classList.toggle(
        "menu-open"
    );

    overlay.classList.toggle(
        "overlay-show"
    );

}


function closeMenu() {

    const menu =
        document.getElementById("sideMenu");

    const overlay =
        document.getElementById("menuOverlay");


    if (menu) {

        menu.classList.remove(
            "menu-open"
        );

    }


    if (overlay) {

        overlay.classList.remove(
            "overlay-show"
        );

    }

}


// ==========================================
// ASSESSMENT SETUP
// ==========================================

function setupAssessment() {

    const cameraButton =
        document.querySelector(".scan-btn");

    const galleryButton =
        document.querySelector(".gallery-btn");

    const analyzeButton =
        document.getElementById("analyzeBtn");


    // Camera

    if (cameraButton) {

        cameraButton.addEventListener(
            "click",
            openCamera
        );

    }


    // Gallery

    if (galleryButton) {

        galleryButton.addEventListener(
            "click",
            openGallery
        );

    }


    // Analyze

    if (analyzeButton) {

        analyzeButton.addEventListener(
            "click",
            analyzeCapturedImage
        );

    }


    // Gallery file selection

    if (galleryInput) {

        galleryInput.addEventListener(
            "change",
            handleGalleryImage
        );

    }


    // Camera close button

    const cameraCloseButton =
        document.querySelector(
            ".close-camera"
        );


    if (cameraCloseButton) {

        cameraCloseButton.addEventListener(
            "click",
            closeCamera
        );

    }


    // Capture button

    const captureButton =
        document.querySelector(
            ".capture-btn"
        );


    if (captureButton) {

        captureButton.addEventListener(
            "click",
            captureImage
        );

    }

}


// ==========================================
// OLD IMAGE INPUT SUPPORT
// ==========================================

if (imageInput) {

    imageInput.addEventListener(
        "change",
        function () {

            if (
                this.files &&
                this.files.length > 0
            ) {

                currentImageFile =
                    this.files[0];


                if (imageName) {

                    imageName.textContent =
                        "Selected: " +
                        this.files[0].name;

                }


                showImagePreview(
                    this.files[0]
                );

            }

        }
    );

}


// ==========================================
// OPEN CAMERA
// ==========================================

async function openCamera() {

    if (
        !cameraModal ||
        !cameraVideo
    ) {

        alert(
            "Camera section nahi mila."
        );

        return;

    }


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

        closeCamera();


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


        cameraVideo.srcObject =
            cameraStream;


        cameraModal.style.display =
            "flex";


        cameraVideo.style.display =
            "block";


        await cameraVideo.play();


        isCapturing = false;


        // Hide manual capture because
        // automatic detection is enabled

        const captureButton =
            document.querySelector(
                ".capture-btn"
            );


        if (captureButton) {

            captureButton.style.display =
                "none";

        }


        showScanningMessage();

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
                "Camera kisi aur application me use ho raha hai. Dusre camera apps band karo."
            );

        }

        else {

            alert(
                "Camera open nahi ho paya. Camera permission check karo."
            );

        }

    }

}


// ==========================================
// SCANNING MESSAGE
// ==========================================

function showScanningMessage() {

    const oldMessage =
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


    if (!status) {
        return;
    }


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


// ==========================================
// START AUTOMATIC SCAN
// ==========================================

function startAutomaticScan() {

    stopAutomaticScan();


    scanTimer =
        setTimeout(
            detectOnion,
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


    let onionPixels = 0;

    let totalPixels = 0;


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


        if (
            r < 35 &&
            g < 35 &&
            b < 35
        ) {

            continue;

        }


        totalPixels++;


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


        detectionTimer =
            setTimeout(
                function () {

                    if (!isCapturing) {

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


    isCapturing = true;


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

        isCapturing = false;

        return;

    }


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


    cameraCanvas.toBlob(

        function (blob) {

            if (!blob) {

                alert(
                    "Image capture nahi ho payi."
                );

                isCapturing = false;

                return;

            }


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


            closeCamera();


            showImagePreview(
                file
            );

        },

        "image/jpeg",

        0.90

    );

}


// ==========================================
// MANUAL CAPTURE
// ==========================================

function captureImage() {

    captureAutomatically();

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


        cameraStream = null;

    }


    if (cameraVideo) {

        cameraVideo.srcObject =
            null;

    }


    if (cameraModal) {

        cameraModal.style.display =
            "none";

    }


    isCapturing = false;

}


// ==========================================
// STOP SCAN
// ==========================================

function stopAutomaticScan() {

    if (scanTimer) {

        clearTimeout(
            scanTimer
        );

        scanTimer = null;

    }


    if (detectionTimer) {

        clearTimeout(
            detectionTimer
        );

        detectionTimer = null;

    }

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
// GALLERY IMAGE
// ==========================================

function handleGalleryImage() {

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

            <p style="
                color:#159447;
                font-weight:600;
                margin:10px 0;
            ">

                ✅ Onion image captured successfully

            </p>

        </div>

    `;

}


// ==========================================
// BATCH ID
// ==========================================

function generateBatchId() {

    const year =
        new Date().getFullYear();


    let batchNumber =
        parseInt(
            localStorage.getItem(
                "onioniqBatchNumber"
            ) || "0"
        );


    batchNumber++;


    localStorage.setItem(
        "onioniqBatchNumber",
        batchNumber
    );


    const formattedNumber =
        String(
            batchNumber
        ).padStart(
            4,
            "0"
        );


    return `ON-${year}-${formattedNumber}`;

}


// ==========================================
// SET BATCH ID
// ==========================================

function setAutomaticBatchId() {

    const batchIdElement =
        document.getElementById(
            "batchId"
        );


    if (!batchIdElement) {
        return;
    }


    if (
        !batchIdElement.value.trim()
    ) {

        batchIdElement.value =
            generateBatchId();

    }

}


// ==========================================
// ANALYZE
// ==========================================

function analyzeImage() {

    analyzeCapturedImage();

}


function analyzeOnion() {

    analyzeCapturedImage();

}


// ==========================================
// AI ANALYSIS
// ==========================================

async function analyzeCapturedImage() {

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
    // FORM VALIDATION
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
    // IMAGE VALIDATION
    // ======================================

    if (!currentImageFile) {

        alert(
            "Please scan or select an onion image."
        );

        return;

    }


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

        const formData =
            new FormData();


        formData.append(
            "image",
            currentImageFile
        );


        formData.append(
            "farmerName",
            document.getElementById("farmerName")?.value.trim() || ""
        );

        
        formData.append(
            "batchId",
            document.getElementById("batchId")?.value.trim() || ""
        );


        formData.append(
            "quantity",
            document.getElementById("quantity")?.value.trim() || ""
        );


        formData.append(
            "location",
            document.getElementById("location")?.value.trim() || ""
        );


        // ==================================
        // BACKEND
        // ==================================

        const response =
            await fetch(
                "https://onioniq-vvar.onrender.com/analyze-onion",
                {
                    method: "POST",
                    body: formData
                }
            );


        const data =
            await response.json();


        console.log(
            "Gemini AI Response:",
            data
        );


        if (!response.ok) {

            throw new Error(
                data.error ||
                data.details ||
                "AI analysis failed."
            );

        }


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
                        ${escapeHTML(
                            error.message
                        )}
                    </p>

                    <button
                        type="button"
                        class="analyze-btn retry-analysis-btn">

                        🔄 Try Again

                    </button>

                </div>

            `;


            const retryButton =
                resultPanel.querySelector(
                    ".retry-analysis-btn"
                );


            if (retryButton) {

                retryButton.addEventListener(
                    "click",
                    analyzeCapturedImage
                );

            }

        }

    }

}


// ==========================================
// SHOW AI RESULT
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
    // SAVE DATA FOR PDF
    // ======================================

    window.lastAIResult =
        data;

    window.lastBatchId =
        batchId;

    window.lastFarmerName =
        document.getElementById(
            "farmerName"
        )?.value.trim() || "";

    window.lastQuantity =
        document.getElementById(
            "quantity"
        )?.value.trim() || "";

    window.lastLocation =
        document.getElementById(
            "location"
        )?.value.trim() || "";

    window.lastImageFile =
        currentImageFile;


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
    // GRADE CLASS
    // ======================================

    let gradeClass =
        "grade-result";


    if (
        String(grade).toUpperCase() ===
        "A"
    ) {

        gradeClass =
            "grade-result grade-a-result";

    }

    else if (
        String(grade).toUpperCase() ===
        "B"
    ) {

        gradeClass =
            "grade-result grade-b-result";

    }

    else if (
        String(grade).toUpperCase() ===
        "C"
    ) {

        gradeClass =
            "grade-result grade-c-result";

    }


    // ======================================
    // DEFECTS
    // ======================================

    let defectsHTML = "";


    if (
        Array.isArray(data.defects) &&
        data.defects.length > 0
    ) {

        defectsHTML = `

            <div class="defects-box">

                <div class="defects-title">
                    ⚠️ Detected Defects
                </div>

                <ul class="defects-list">

                    ${data.defects
                        .map(
                            defect =>
                                `<li>
                                    ${escapeHTML(defect)}
                                </li>`
                        )
                        .join("")}

                </ul>

            </div>

        `;

    }

    else {

        defectsHTML = `

            <div class="defects-box">

                <div class="defects-title">
                    ✅ Detected Defects
                </div>

                <p style="
                    margin:0;
                    color:#4d843d;
                    font-size:11px;
                ">

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

            <!-- HEADER -->

            <div class="result-title">

                <div class="result-ai-icon">
                    🤖
                </div>

                <div>

                    <p class="result-label">
                        AI ASSESSMENT
                    </p>

                    <h3>
                        Quality Result
                    </h3>

                </div>

            </div>


            <!-- BATCH -->

            <div class="result-batch">

                <span>
                    Batch ID
                </span>

                <strong>
                    ${escapeHTML(batchId)}
                </strong>

            </div>


            <!-- SCORE -->

            <div class="score-card">

                <div class="score-circle">

                    <strong>
                        ${qualityScore}
                    </strong>

                    <span>
                        /100
                    </span>

                </div>

                <div class="score-info">

                    <span>
                        QUALITY SCORE
                    </span>

                    <p>
                        Overall onion quality
                    </p>

                </div>

            </div>


            <!-- GRADE -->

            <div class="${gradeClass}">

                <span>
                    OVERALL GRADE
                </span>

                <strong>
                    Grade ${escapeHTML(grade)}
                </strong>

                <small>
                    AI-assisted classification
                </small>

            </div>


            <!-- GRADE A + URS -->

            <div class="result-mini-grid">

                <div class="result-mini-card grade-a-mini">

                    <span>
                        Grade A
                    </span>

                    <strong>
                        ${gradeAPercentage}%
                    </strong>

                    <small>
                        Premium quality
                    </small>

                </div>


                <div class="result-mini-card urs-mini">

                    <span>
                        URS
                    </span>

                    <strong>
                        ${ursPercentage}%
                    </strong>

                    <small>
                        Undersized
                    </small>

                </div>

            </div>


            <!-- PARAMETERS -->

            <div class="parameters-title">
                Quality Parameters
            </div>


            ${createQualityItem(
                "Size",
                size
            )}


            ${createQualityItem(
                "Color",
                color
            )}


            ${createQualityItem(
                "Visible Defects",
                visibleDefects
            )}


            ${createQualityItem(
                "Uniformity",
                uniformity
            )}


            <!-- DEFECTS -->

            ${defectsHTML}


            <!-- RECOMMENDATION -->

            <div class="recommendation-box">

                <div class="recommendation-title">

                    💡

                    <strong>
                        Recommendation
                    </strong>

                </div>

                <p>
                    ${escapeHTML(
                        recommendation
                    )}
                </p>

            </div>


            <!-- PDF -->

            <button
                type="button"
                class="result-action-btn pdf-btn"
                id="downloadPdfBtn">

                📄
                <span>
                    Download PDF Report
                </span>

            </button>


            <!-- NEW ASSESSMENT -->

            <button
                type="button"
                class="result-action-btn new-assessment-btn"
                id="newAssessmentBtn">

                🔄
                <span>
                    New Assessment
                </span>

            </button>

        </div>

    `;


    // ======================================
    // RESULT BUTTON EVENTS
    // ======================================

    const pdfButton =
        document.getElementById(
            "downloadPdfBtn"
        );


    if (pdfButton) {

        pdfButton.addEventListener(
            "click",
            downloadPDF
        );

    }


    const newAssessmentButton =
        document.getElementById(
            "newAssessmentBtn"
        );


    if (newAssessmentButton) {

        newAssessmentButton.addEventListener(
            "click",
            function () {

                window.location.reload();

            }
        );

    }

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
                    ${escapeHTML(title)}
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
// DOWNLOAD PDF
// ==========================================

async function downloadPDF() {

    if (!window.lastAIResult) {

        alert(
            "Please complete an AI assessment first."
        );

        return;

    }


    if (!window.jspdf) {

        alert(
            "PDF library load nahi hui."
        );

        return;

    }


    const { jsPDF } =
        window.jspdf;


    const data =
        window.lastAIResult;


    const doc =
        new jsPDF();


    // ======================================
    // DETAILS
    // ======================================

    const farmerName =
        window.lastFarmerName ||
        "N/A";


    const batchId =
        window.lastBatchId ||
        "N/A";


    const quantity =
        window.lastQuantity ||
        "N/A";


    const location =
        window.lastLocation ||
        "N/A";


    // ======================================
    // AI RESULTS
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
    // PDF TITLE
    // ======================================

    doc.setFontSize(22);

    doc.text(
        "OnionIQ",
        20,
        20
    );


    doc.setFontSize(12);

    doc.text(
        "AI-Assisted Onion Quality Assessment Report",
        20,
        30
    );


    doc.setFontSize(10);

    doc.text(
        "Assessment Date: " +
        new Date().toLocaleString(),
        20,
        40
    );


    // ======================================
    // BATCH INFORMATION
    // ======================================

    doc.setFontSize(15);

    doc.text(
        "Batch Information",
        20,
        55
    );


    doc.setFontSize(11);

    doc.text(
        "Farmer Name: " +
        farmerName,
        20,
        65
    );


    doc.text(
        "Batch ID: " +
        batchId,
        20,
        73
    );


    doc.text(
        "Quantity: " +
        quantity +
        " kg",
        20,
        81
    );


    doc.text(
        "Location: " +
        location,
        20,
        89
    );


    // ======================================
    // AI ASSESSMENT
    // ======================================

    doc.setFontSize(15);

    doc.text(
        "AI Quality Assessment",
        20,
        105
    );


    doc.setFontSize(11);

    doc.text(
        "Quality Score: " +
        qualityScore +
        "/100",
        20,
        116
    );


    doc.text(
        "Overall Grade: " +
        grade,
        20,
        124
    );


    doc.text(
        "Grade A Percentage: " +
        gradeAPercentage +
        "%",
        20,
        132
    );


    doc.text(
        "Undersized (URS): " +
        ursPercentage +
        "%",
        20,
        140
    );


    // ======================================
    // QUALITY PARAMETERS
    // ======================================

    doc.setFontSize(15);

    doc.text(
        "Quality Parameters",
        20,
        157
    );


    doc.setFontSize(11);

    doc.text(
        "Size: " +
        size +
        "%",
        20,
        168
    );


    doc.text(
        "Color: " +
        color +
        "%",
        20,
        176
    );


    doc.text(
        "Visible Defects: " +
        visibleDefects +
        "%",
        20,
        184
    );


    doc.text(
        "Uniformity: " +
        uniformity +
        "%",
        20,
        192
    );


    // ======================================
    // DEFECTS
    // ======================================

    doc.setFontSize(15);

    doc.text(
        "Detected Defects",
        20,
        209
    );


    doc.setFontSize(11);


    let y = 220;


    if (
        Array.isArray(data.defects) &&
        data.defects.length > 0
    ) {

        data.defects.forEach(
            function (defect) {

                const lines =
                    doc.splitTextToSize(
                        "- " +
                        String(defect),
                        165
                    );


                doc.text(
                    lines,
                    25,
                    y
                );


                y +=
                    8 *
                    lines.length;

            }
        );

    }

    else {

        doc.text(
            "No major visible defects detected.",
            25,
            y
        );

        y += 8;

    }


    // ======================================
    // RECOMMENDATION
    // ======================================

    y += 10;


    doc.setFontSize(15);

    doc.text(
        "Recommendation",
        20,
        y
    );


    y += 10;


    doc.setFontSize(11);


    const recommendationLines =
        doc.splitTextToSize(
            recommendation,
            170
        );


    doc.text(
        recommendationLines,
        20,
        y
    );


    // ======================================
    // FOOTER
    // ======================================

    doc.setFontSize(9);

    doc.text(
        "Generated by OnionIQ",
        20,
        285
    );


    // ======================================
    // FILE NAME
    // ======================================

    const filename =
        "OnionIQ_Report_" +
        batchId +
        ".pdf";


    // ======================================
    // ANDROID APP
    // ======================================

    if (
        window.AndroidPDF &&
        typeof window.AndroidPDF.savePDF ===
        "function"
    ) {

        try {

            const pdfBase64 =
                doc.output(
                    "datauristring"
                )
                .split(",")[1];


            const result =
                window.AndroidPDF.savePDF(
                    pdfBase64,
                    filename
                );


            console.log(
                "Android PDF result:",
                result
            );


            if (
                result ===
                "SUCCESS"
            ) {

                alert(
                    "✅ PDF saved successfully!\n\n" +
                    "Files → Downloads → OnionIQ"
                );

            }

            else {

                alert(
                    "❌ PDF save failed.\n\n" +
                    result
                );

            }

        }

        catch (error) {

            console.error(
                "Android PDF Error:",
                error
            );


            alert(
                "❌ PDF save failed.\n\n" +
                error.message
            );

        }


        return;

    }


    // ======================================
    // LAPTOP / BROWSER
    // ======================================

    doc.save(
        filename
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

            closeMenu();

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

async function loadHistory() {

    const historyList =
        document.getElementById("historyList");

    const loadingHistory =
        document.getElementById("loadingHistory");

    const noHistory =
        document.getElementById("noHistory");

    if (!historyList) {
        return;
    }

    try {

        const response =
            await fetch(
                "https://onioniq-vvar.onrender.com/assessments"
            );

        if (!response.ok) {
            throw new Error(
                "Failed to load assessments"
            );
        }

        const assessments =
            await response.json();

        if (loadingHistory) {
            loadingHistory.style.display = "none";
        }

        // Remove old generated cards
        historyList
            .querySelectorAll(".history-card")
            .forEach(card => card.remove());

        if (
            !Array.isArray(assessments) ||
            assessments.length === 0
        ) {

            if (noHistory) {
                noHistory.style.display = "block";
            }

            return;
        }

        if (noHistory) {
            noHistory.style.display = "none";
        }

        assessments.forEach(
            assessment => {

                const card =
                    createHistoryCard(
                        assessment
                    );

                historyList.insertBefore(
                    card,
                    noHistory
                );
            }
        );

    } catch (error) {

        console.error(
            "History loading error:",
            error
        );

        if (loadingHistory) {
            loadingHistory.innerHTML = `
                <div>⚠️</div>

                <h3>
                    Unable to load history
                </h3>

                <p>
                    Please make sure the backend is running.
                </p>
            `;
        }
    }
}


function createHistoryCard(assessment) {

    const card =
        document.createElement("div");

    card.className =
        "history-card";

    const grade =
        assessment.grade || "N/A";

    const gradeClass =
        grade === "A"
            ? "grade-a"
            : grade === "B"
            ? "grade-b"
            : grade === "C"
            ? "grade-c"
            : "grade-d";

    const date =
        assessment.createdAt
            ? new Date(
                assessment.createdAt
              ).toLocaleDateString(
                "en-GB",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
              )
            : "Date unavailable";

    card.innerHTML = `

        <div class="history-card-top">

            <div>

                <span class="batch-label">
                    BATCH
                </span>

                <h3>
                    ${escapeHistoryText(
                        assessment.batchId ||
                        assessment.assessmentId ||
                        "N/A"
                    )}
                </h3>

            </div>

            <span class="history-grade ${gradeClass}">
                Grade ${escapeHistoryText(grade)}
            </span>

        </div>


        <div class="history-details">

            <div>

                <small>
                    Farmer
                </small>

                <strong>
                    ${escapeHistoryText(
                        assessment.farmerName ||
                        "N/A"
                    )}
                </strong>

            </div>


            <div>

                <small>
                    Location
                </small>

                <strong>
                    ${escapeHistoryText(
                        assessment.location ||
                        "N/A"
                    )}
                </strong>

            </div>


            <div>

                <small>
                    Quantity
                </small>

                <strong>
                    ${escapeHistoryText(
                        assessment.quantity ||
                        "N/A"
                    )}
                </strong>

            </div>


            <div>

                <small>
                    Score
                </small>

                <strong>
                    ${Number(
                        assessment.qualityScore || 0
                    )}/100
                </strong>

            </div>

        </div>


        <div class="history-footer">

            <span>
                📅 ${date}
            </span>

            <span class="status-success">
                ✓ Assessed
            </span>

        </div>

    `;

    return card;
}


function escapeHistoryText(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function searchHistory() {

    const input =
        document.getElementById(
            "historySearch"
        );

    const search =
        input
            ? input.value
                .toLowerCase()
                .trim()
            : "";

    const cards =
        document.querySelectorAll(
            "#historyList .history-card"
        );

    let visibleCount = 0;

    cards.forEach(card => {

        const text =
            card.innerText.toLowerCase();

        if (
            text.includes(search)
        ) {

            card.style.display =
                "";

            visibleCount++;

        } else {

            card.style.display =
                "none";
        }
    });

    const noHistory =
        document.getElementById(
            "noHistory"
        );

    if (noHistory) {

        noHistory.style.display =
            visibleCount === 0
                ? "block"
                : "none";
    }
}


function clearHistorySearch() {

    const input =
        document.getElementById(
            "historySearch"
        );

    if (input) {
        input.value = "";
    }

    searchHistory();
}

if (
    window.location.pathname.endsWith(
        "history.html"
    )
) {
    loadHistory();
}

// =========================
// Dashboard Data
// =========================

async function loadDashboard() {

    const totalBatches =
        document.getElementById("totalBatches");

    const gradeA =
        document.getElementById("gradeAPercentage");

    const gradeB =
        document.getElementById("gradeBPercentage");

    const gradeC =
        document.getElementById("gradeCPercentage");

    const gradeD =
        document.getElementById("gradeDPercentage");    

    const recentTable =
        document.getElementById("recentAssessments");

    // Run only on dashboard page
    if (!recentTable) {
        return;
    }

    try {

        const response =
            await fetch(
                "https://onioniq-vvar.onrender.com/assessments"
            );

        if (!response.ok) {
            throw new Error(
                "Failed to fetch dashboard data"
            );
        }

        const assessments =
            await response.json();


        // =========================
        // Total Batches
        // =========================

        const total =
            assessments.length;

        if (totalBatches) {
            totalBatches.textContent =
                total.toLocaleString();
        }


        // =========================
        // Grade Counts
        // =========================

        let countA = 0;
        let countB = 0;
        let countC = 0;
        let countD = 0;

        assessments.forEach(
            assessment => {

                const grade =
                    String(
                        assessment.grade || ""
                    ).toUpperCase();

                if (grade === "A") {
                    countA++;
                }

                if (grade === "B") {
                    countB++;
                }

                if (grade === "C") {
                    countC++;
                }

                if (grade === "D") {
                    countD++;
                }
            }
        );


        // =========================
        // Grade Percentages
        // =========================

        if (total > 0) {

            if (gradeA) {
                gradeA.textContent =
                    Math.round(
                        (countA / total) * 100
                    ) + "%";
            }

            if (gradeB) {
                gradeB.textContent =
                    Math.round(
                        (countB / total) * 100
                    ) + "%";
            }

            if (gradeC) {
                gradeC.textContent =
                    Math.round(
                        (countC / total) * 100
                    ) + "%";
            }

            if (gradeD) {
                gradeD.textContent =
                    Math.round(
                        (countD / total) * 100
                    ) + "%";
            }

        } else {

            if (gradeA) gradeA.textContent = "0%";
            if (gradeB) gradeB.textContent = "0%";
            if (gradeC) gradeC.textContent = "0%";
            if (gradeD) gradeD.textContent = "0%";
        }


        // =========================
        // Recent Assessments
        // =========================

        recentTable.innerHTML = "";


        if (assessments.length === 0) {

            recentTable.innerHTML = `
                <tr>
                    <td colspan="4">
                        No assessments found
                    </td>
                </tr>
            `;

            return;
        }


        // Latest 5 assessments
        const recent =
            assessments.slice(0, 5);


        recent.forEach(
            assessment => {

                const row =
                    document.createElement("tr");

                const grade =
                    String(
                        assessment.grade || "N/A"
                    ).toUpperCase();


                let gradeClass = "";

                if (grade === "A") {
                    gradeClass = "grade-a";
                } else if (grade === "B") {
                    gradeClass = "grade-b";
                } else if (grade === "C") {
                    gradeClass = "grade-c";
                }


                row.innerHTML = `

                    <td>
                        ${escapeHistoryText(
                            assessment.batchId ||
                            assessment.assessmentId ||
                            "N/A"
                        )}
                    </td>

                    <td>
                        ${escapeHistoryText(
                            assessment.location ||
                            "N/A"
                        )}
                    </td>

                    <td>
                        ${Number(
                            assessment.qualityScore || 0
                        )}
                    </td>

                    <td class="${gradeClass}">
                        ${escapeHistoryText(grade)}
                    </td>

                `;


                recentTable.appendChild(row);
            }
        );

    } catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );

        recentTable.innerHTML = `
            <tr>
                <td colspan="4">
                    Unable to load dashboard data
                </td>
            </tr>
        `;
    }
}


// =========================
// Load Dashboard
// =========================

if (
    window.location.pathname.endsWith(
        "dashboard.html"
    )
) {
    loadDashboard();
}