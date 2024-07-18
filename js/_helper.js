import * as unity from "./unity.js";
const debug = console.log;
const vmsSlipRegistor = "vmsSlipRegistor";
let video = null;
let canvas = null;
let stream = null;
let videoConfig = null;
export async function startWebCam(selectCamera = false) {
    if (selectCamera) {
        if (stream) {
            stream.getTracks().forEach(async function (track) {
                await track.stop();
            });
        }
        localStorage.setItem("localStorageCamera", null);
    }
    ModalWebCamSnap.showModal();
    const medias = await navigator.mediaDevices.enumerateDevices();
    const cam = { video: null, audio: false };
    const cams = [];
    let inputOptions = `<select class="form-select form-select-lg mb-3" id="dialogModalReturnValue">`;
    for (let index = 0; index < medias.length; index++) {
        const media = medias[index];
        if (media.kind === "videoinput") {
            cams.push(media);
        }
    }
    let defaultCamera = null;
    let localStorageCamera = localStorage.getItem("localStorageCamera");
    for (let index = 0; index < cams.length; index++) {
        const c = cams[index];
        inputOptions += `<option value="${index}" >${c.label}</option>`;
        if (localStorageCamera == c.label) {
            defaultCamera = index;
            // unity.toastr_notify({ icon: "info", msg: "select defaultCamera :" + index });
        }
    }
    inputOptions += `</select>`;
    debug(inputOptions);
    if (cams.length == 1) {
        cam.video = cams[0];
    } else {
        if (defaultCamera != null) {
            cam.video = cams[parseInt(defaultCamera)];
        } else {
            const result = await unity.dialogModal({ title: "เลือกกล้องถ่ายรูป", content: inputOptions });
            if (result.value && result.confirm) {
                cam.video = cams[parseInt(result.value)];
                localStorage.setItem("localStorageCamera", cams[parseInt(result.value)].label);
                unity.toastr_notify({ icon: "info", msg: cams[parseInt(result.value)].label });
            }
        }
    }
    if (cam.video) {
        video = document.getElementById("video_web_cam");
        // debug(cam);
        stream = await navigator.mediaDevices.getUserMedia(cam);
        video.srcObject = stream;
        videoConfig = stream.getVideoTracks()[0].getSettings();
        // debug(videoConfig);
    } else {
        ModalWebCamSnap.close();
    }
}

export function stopWebCam() {
    if (stream) {
        stream.getTracks().forEach(function (track) {
            track.stop();
        });
    }
    ModalWebCamSnap.close();
    stream = null;
}
function watermarkedDataURL(canvas) {
    const WATER_MARK_TEXT = "PKSOFTTECH.ORG     PKSOFTTECH.ORG";
    const tempCanvas = document.querySelector("#canvas_web_cam_water_mark");
    const tempCtx = tempCanvas.getContext("2d");
    let cw, ch;
    cw = tempCanvas.width = canvas.width;
    ch = tempCanvas.height = canvas.height;
    tempCtx.drawImage(canvas, 0, 0);
    tempCtx.font = "16px sans-serif";
    if (cw > 400) {
        tempCtx.font = "24px sans-serif";
    }
    debug(tempCtx.font);

    tempCtx.globalAlpha = 0.9;
    tempCtx.fillStyle = "red";
    // tempCtx.rotate(-Math.PI / 4);
    tempCtx.textAlign = "center";
    tempCtx.fillText(WATER_MARK_TEXT, cw / 2, ch / 2);
    tempCtx.fillText("ใช้สำหรับทำรายการระบบ CVMS เท่านั้น", cw / 2, ch / 2 + 50);
    return tempCanvas.toDataURL();
}

export async function takePicture(id) {
    debug(id);
    canvas = document.querySelector("#canvas_web_cam");
    canvas.width = videoConfig.width;
    canvas.height = videoConfig.height;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    debug(canvas.width, canvas.height);
    const dataURL = watermarkedDataURL(canvas);
    // const image_data_url = canvas.toDataURL("image/png");
    const element = document.getElementById(id);
    element.setAttribute("src", dataURL);
    unity.toastr_notify({ icon: "success", msg: "ถ่ายรูปสำเร็จ" });
    stopWebCam();
}

let html5QrcodeScanner = null;
export function scanQR(mode = true, callBack = null) {
    if (mode) {
        ModalQrCodeScan.showModal();
        function onScanSuccess(decodedText, decodedResult) {
            console.log(`Scan result ${decodedText}`, decodedResult);
            html5QrcodeScanner.clear();
            ModalQrCodeScan.close();
            unity.toastr_notify({ icon: "success", msg: "Qr Code success :" + `${decodedText}` });
            if (callBack) {
                callBack(`${decodedText}`);
            }
        }
        html5QrcodeScanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 200 });
        html5QrcodeScanner.render(onScanSuccess);
    } else {
        ModalQrCodeScan.close();
        if (html5QrcodeScanner) {
            html5QrcodeScanner.clear();
        }
    }
}

let QRCODE = null;
export function generateSlip(data) {
    function wrapText(context, text, x, y, lineHeight) {
        const words = text.split("\n");
        for (let n = 0; n < words.length; n++) {
            const testLine = words[n];
            context.fillText(testLine, x, y);
            y += lineHeight;
        }
    }
    // debug(unity.silpImageBase.width, unity.silpImageBase.height);
    const element = document.getElementById(vmsSlipRegistor);
    canvas = document.querySelector("#canvas_web_cam");
    canvas.width = unity.silpImageBase.width;
    canvas.height = unity.silpImageBase.height;
    canvas.getContext("2d").drawImage(unity.silpImageBase, 0, 0, canvas.width, canvas.height);
    const tempCanvas = document.querySelector("#canvas_web_cam_water_mark");
    const tempCtx = tempCanvas.getContext("2d");
    let cw, ch;
    cw = tempCanvas.width = canvas.width;
    ch = tempCanvas.height = canvas.height;
    tempCtx.drawImage(canvas, 0, 0);
    // tempCtx.font = "bold 16px Courier";
    data.card_id = "002";
    const slipTitle = `
เลขบัตรประชาชน   
(ใบขับขี่)
-----------------------
ชื่อ-นามสกุล
ทะเบียนรถ 
เบอร์โทรศัพท์
บริษัท/สังกัด
วัตถุประสงค์
ติดต่อ
    `;

    const slipText = `

      ${data.card_id ? data.card_id : "-"}
      
      ${data.name ? data.name : "-"}
      ${data.license ? data.license : "-"}
      ${data.tel ? data.tel : "-"}
      ${data.company ? data.company : "-"}
      ${data.objective ? data.objective : "-"}
    `;

    tempCtx.globalAlpha = 0.9;
    tempCtx.fillStyle = "#000000";
    const pyText = ch * 0.5;
    const pxTextTitle = cw * 0.1;
    const pxText = cw * 0.3;
    const fontSize = 32;
    const fontName = "Courier New";
    const lintHeight = 1.5;
    // for Qr Code
    const qrCodeSize = 200;
    const qrPos = { px: 0.5, py: 0.35 };

    tempCtx.font = `bold ${fontSize}px ${fontName}`;
    wrapText(tempCtx, slipTitle, pxTextTitle, pyText, fontSize * lintHeight);
    tempCtx.font = `bold ${fontSize}px ${fontName}`;
    wrapText(tempCtx, slipText, pxText, pyText, fontSize * lintHeight);

    if (!QRCODE) {
        QRCODE = new QRCode("qrcode", {
            width: qrCodeSize,
            height: qrCodeSize,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H,
        });
    }
    const qrCanvas = QRCODE._oDrawing._elCanvas;
    QRCODE.clear(); // clear the code.
    QRCODE.makeCode("002"); // make another code.

    tempCtx.drawImage(
        qrCanvas,
        (canvas.width - qrCanvas.width) * qrPos.px,
        (canvas.height - qrCanvas.height) * qrPos.py
    );
    element.setAttribute("src", tempCanvas.toDataURL());
}

export async function printSlip() {
    // const deviceApiStatus = await unity.deviceAppService.getStatus();
    // if (deviceApiStatus) {
    //     unity.deviceAppService.isConnect = true;
    // }
    if (await unity.deviceAppService.getStatus()) {
        const _reply = await unity.deviceAppService.printImage(vmsSlipRegistor);
        if (_reply) {
            unity.toastr_notify({ icon: "info", msg: "Successful" + `${_reply.ststus}` });
        } else {
            unity.toastr_notify({ icon: "error", msg: "printSlip Error" });
        }
    } else {
        // unity.toastr_notify({ icon: "warning", msg: "deviceAppService not Connect" });
        printJS({
            printable: document.getElementById(vmsSlipRegistor).src,
            type: "image",
            header: "", // Optional
            showModal: true, // Optional
            modalMessage: "Printing...", // Optional
            style: "img { max-width: 800px;}", // Optional
        });
    }
}
debug("Load Module : _hepler Successful");
