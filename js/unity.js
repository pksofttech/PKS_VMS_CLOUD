/**
 * Logs debug messages to the console.
 */
export const debug = console.log;

/**
 * Logs messages to the console.
 */
export const printLog = console.log;

/**
 * Logs informational messages to the console.
 */
export const printInfo = console.info;

/**
 * Logs warning messages to the console.
 */
export const printWarn = console.warn;

/**
 * Logs error messages to the console.
 */
export const printError = console.error;

/**
 * Logs the contents of a FormData object to the console for debugging purposes.
 *
 * @param {FormData} formData - The FormData object to be debugged.
 */
export function debugForm(formData) {
    console.log("***************************************");
    for (const pair of formData.entries()) {
        console.log(`${pair[0]}, ${pair[1]}`);
    }
    console.log("***************************************");
}

export const UserSession = {
    data: { siteName: "", system_user_id: "", siteUser: "", fullName: "", level: "", token: "", sessionMode: true },
    async loadLocalStroe() {
        const _datalocalStorage = JSON.parse(localStorage.getItem("UserSession"));
        if (_datalocalStorage) {
            this.data = _datalocalStorage;
        }
        debug(this.data);
    },

    async saveLocalStroe(s = false) {
        localStorage.setItem("UserSession", JSON.stringify(this.data));
        debug("localStorage", this.data);
    },
};

export function showWaitDialog(v) {
    if (v) {
        modalWait.showModal();
    } else {
        modalWait.close();
    }
}

export const silpImageBase = new Image();

class DeviceAppService {
    isConnect = false;
    // host = "http://192.168.1.219:8080";
    host = "http://localhost:8080";
    async getStatus() {
        const result = await fetchApi(this.host + "/api/getstatus", "get", null, "json");
        if (!!result) {
            // debug(result);
            return result;
        }
        return null;
    }
    async printImage(elementId) {
        showWaitDialog(true);
        // await delay(3000);
        const formData = new FormData();
        formData.append("cmd", "PRINT_IMAGE");
        formData.append("image", await dataURLtoFile(document.getElementById(elementId).src, "image"));
        const _reply = await fetchApi(this.host + "/api/printImage", "post", formData, "json");
        debug(_reply);
        showWaitDialog(false);
        if (!!_reply) {
            // debug(result);
            return _reply;
        }
        return null;
    }
}

export const deviceAppService = new DeviceAppService();

let controlSound = true;
const soundBtn = new Howl({
    src: ["/static/sound/click-button-140881.mp3"],
});

const soundError = new Howl({
    src: ["/static/sound/computer-error-meme-jam-fx-1-00-02.mp3"],
});

const soundSuccess = new Howl({
    src: ["/static/sound/success-1-6297.mp3"],
});

export function btnClickSound(params) {
    if (controlSound) {
        soundBtn.play();
    }
}

function errorSound(params) {
    if (controlSound) {
        soundError.play();
    }
}

export function successSound(params) {
    if (controlSound) {
        soundSuccess.play();
    }
}
export function setControlSound(v) {
    controlSound = v;
    btnClickSound();
    localStorage.setItem("sound", String(v));
    // debug("localStorage :" + String(v));
    // toastr_notify({ msg: localStorage.getItem("sound") });
}

// For DATATABLE CONFIG
export let PAGE_LENGTH = 50;
export let LENGTH_MENU = [
    [10, 25, 50, 100, 500, 1000],
    [10, 25, 50, 100, 500, "1K"],
];

export const TABLE_LANGUAGE = {
    infoEmpty: "ไม่มีรายการข้อมูล",
    info: "แสดง หน้าข้อมูล _PAGE_ ใน _PAGES_ จากทั้งหมด _TOTAL_ รายการ",
    infoFiltered: "(ข้อมูลทั้งหมด _MAX_ รายการ)",
    sSearch: "❔ ค้นหา",
};

export const columnDefs = [
    {
        className: "text-primary",
        // targets: "_all",
        targets: 0,
    },
];

export function dataTableHeader(title, color = "info") {
    return `<div class="badge  text-bg-${color} py-2 w-100"> ${title}</div>`;
}

export function datatableButton(header_document = null) {
    return [
        {
            text: '<i class="fa-solid fa-rotate  text-primary"></i>',
            action: function (e, dt, node, config) {
                this.ajax.reload();
            },
        },
        {
            text: `<i class="fa-solid fa-print  text-info"></i>`,
            extend: "print",
            footer: true,
            autoPrint: false,
            exportOptions: {
                columns: ":visible",
            },
            customize: function (win) {
                $(win.document.body).css("font-size", "10pt").css("background-color", "white").prepend(header_document);
                $(win.document.body).find("table").addClass("compact border").css("font-size", "inherit");
            },
        },
        {
            extend: "excelHtml5",
            footer: true,
            title: "Report",
            text: '<i class="fa-solid fa-file-excel  text-success"></i>',
            titleAttr: "Export Excel",
            oSelectorOpts: { filter: "applied", order: "current" },
            exportOptions: {
                columns: ":visible",
                modifier: {
                    page: "all",
                },
                format: {
                    header: function (data, columnIdx) {
                        if (columnIdx == 1) {
                            //return 'column_1_header';
                            return data;
                        } else {
                            return data;
                        }
                    },
                },
            },
        },
        {
            extend: "csv",
            text: '<i class="fa-solid fa-file-csv  text-warning"></i>',
        },
        {
            extend: "colvis",
            text: '<i class="fa-solid fa-indent text-danger"></i>',
        },
    ];
}

export class ElementHTML {
    #element;
    #content;
    #tagType = "div";

    // Constructor
    constructor(elementId) {
        this.elementId = elementId;
        this.initializeElement();
    }

    // Initialize the element and its properties
    initializeElement() {
        this.#element = document.getElementById(this.elementId);
        if (this.#element) {
            this.#tagType = this.#element.tagName.toLowerCase();
            this.#content = this.#tagType === "input" ? this.#element.value : this.#element.innerHTML;
        } else {
            console.error(`Element with ID "${this.elementId}" not found.`);
        }
    }

    // Getter for content
    get content() {
        return this.#element ? this.#content : null;
    }

    // Setter for content
    set content(value) {
        if (this.#element) {
            this.#content = value;
            if (this.#tagType === "input") {
                this.#element.value = value;
            } else {
                this.#element.innerHTML = value;
            }
        } else {
            console.warn("Element not initialized; content not set.");
        }
    }
}

/**
 * Introduces a delay in execution.
 *
 * @param {number} ms - The number of milliseconds to delay execution.
 * @returns {Promise<void>} - A promise that resolves after the specified delay.
 */
export async function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function toastr_notify({ icon = "info", title = null, msg = "msg" } = {}) {
    if (title) {
        toastr[icon](`<div class="text-lg ">${title}</div>${msg}`);
    } else {
        toastr[icon](`${msg}`);
    }
    switch (icon) {
        case "error":
            errorSound();
            break;
        case "success":
            successSound();
            break;
        default:
            break;
    }
}

export async function dialogModal({ title = "ยืนยันทำรายการ", content = "" } = {}) {
    const result = { confirm: false, value: null };
    function confirmEvent() {
        result.confirm = true;
    }
    const dialogForm = document.getElementById("DialogModal");
    dialogForm.querySelector(`[name="title"]`).innerHTML = title;
    dialogForm.querySelector(`[name="content"]`).innerHTML = content;
    dialogForm.querySelector(`[name="config_btn"]`).onclick = confirmEvent;
    DialogModal.showModal();
    await delay(100);
    while (dialogForm.getAttribute("open") !== null) {
        await delay(100);
    }
    debug(result);
    const dialogModalReturnValue = document.getElementById("dialogModalReturnValue");
    if (dialogModalReturnValue) {
        result.value = dialogModalReturnValue.value;
    }
    return result;
}

export function getLocation(href) {
    var match = href.match(/^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)([\/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/);
    return (
        match && {
            href: href,
            protocol: match[1],
            host: match[2],
            hostname: match[3],
            port: match[4],
            pathname: match[5],
            search: match[6],
            hash: match[7],
        }
    );
}

/**
 * Converts a dateTime object to a formatted string.
 *
 * @param {Date | string | number} dateTime - The date-time to format.
 * @param {string} [format="YYYY/MM/DD HH:mm:ss"] - The format string.
 * @param {number} [daysToAdd=0] - The number of days to add to the dateTime.
 * @returns {string} - The formatted date-time string.
 */
export function dateTimeToStr(dateTime, format = "YYYY/MM/DD HH:mm:ss", daysToAdd = 0) {
    if (!dateTime) {
        return "";
    }
    const momentObj = moment(dateTime);
    if (daysToAdd > 0) {
        momentObj.add(daysToAdd, "days");
    }
    return momentObj.format(format);
}

/**
 * Calculates the difference between two date-time objects and returns it formatted as "HH:mm:ss".
 *
 * @param {Date | string | number} dateTimeStart - The start date-time.
 * @param {Date | string | number} dateTimeEnd - The end date-time.
 * @param {string} [format="YYYY/MM/DD HH:mm:ss"] - The format string for parsing the input date-times.
 * @returns {string} - The formatted time difference as "HH:mm:ss".
 */
export function dateTimeDiff(dateTimeStart, dateTimeEnd, format = "YYYY/MM/DD HH:mm:ss") {
    if (!dateTimeStart) {
        return "";
    }

    const startMoment = moment(dateTimeStart, format);
    const endMoment = dateTimeEnd ? moment(dateTimeEnd, format) : moment();

    const diffInMilliseconds = endMoment.diff(startMoment);
    const diffDuration = moment.duration(diffInMilliseconds);

    return moment.utc(diffDuration.asMilliseconds()).format("HH:mm:ss");
}

/**
 * Calculates the relative time difference between two date-time objects.
 *
 * @param {Date | string | number} dateTimeStart - The start date-time.
 * @param {Date | string | number} dateTimeEnd - The end date-time.
 * @param {string} [format="YYYY/MM/DD HH:mm:ss"] - The format string for parsing the input date-times.
 * @returns {string} - The relative time difference.
 */
export function timeRef(dateTimeStart, dateTimeEnd) {
    const startMoment = dateTimeStart ? moment(dateTimeStart) : moment();
    const endMoment = dateTimeEnd ? moment(dateTimeEnd) : moment();

    if (!dateTimeEnd) {
        return endMoment.to(startMoment);
    } else {
        return startMoment.to(endMoment, true);
    }
}

export function timeDifferenceToString(startDate, endDate) {
    // Calculate the difference in milliseconds
    const diff = Math.abs(endDate - startDate);

    // Define the time units in milliseconds
    const oneDay = 24 * 60 * 60 * 1000;
    const oneHour = 60 * 60 * 1000;
    const oneMinute = 60 * 1000;
    const oneSecond = 1000;

    // Calculate the difference in days, hours, minutes, and seconds
    const days = Math.floor(diff / oneDay);

    const hours = String(Math.floor((diff % oneDay) / oneHour)).padStart(2, "0");
    const minutes = String(Math.floor((diff % oneHour) / oneMinute)).padStart(2, "0");
    const seconds = String(Math.floor((diff % oneMinute) / oneSecond)).padStart(2, "0");

    return `${days ? days + " วัน " : ""} ${hours}:${minutes}:${seconds}`;
}

/**
 * Converts seconds to a human-readable duration format "DD day HH:mm".
 *
 * @param {number} seconds - The total number of seconds.
 * @returns {string} - The formatted duration string.
 */
export function secToDuration(seconds) {
    if (typeof seconds !== "number" || seconds < 0) {
        throw new Error("Input should be a non-negative number.");
    }

    const days = Math.floor(seconds / (24 * 3600));
    const hours = String(Math.floor((seconds % (24 * 3600)) / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");

    let duration = `${hours}:${minutes}`;
    if (days > 0) {
        duration = `${days} day${days > 1 ? "s" : ""} ${duration}`;
    }

    return duration;
}

/**
 * Converts seconds to a human-readable duration format in Thai.
 *
 * @param {number} seconds - The total number of seconds.
 * @returns {string} - The formatted duration string in Thai.
 */
export function secToDurationLocal(seconds) {
    if (typeof seconds !== "number" || seconds < 0) {
        throw new Error("Input should be a non-negative number.");
    }

    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    let duration = `${hours} ชั่วโมง ${minutes} นาที`;
    if (days > 0) {
        duration = `${days} วัน ${duration}`;
    }

    return duration;
}

/**
 * Checks if a string contains only ASCII characters.
 *
 * @param {string} str - The string to be checked.
 * @returns {boolean} - Returns true if the string contains only ASCII characters, false otherwise.
 */
export function isASCII(str) {
    return /^[\x00-\x7F]*$/.test(str);
}

/**
 * Retrieves headers for making API requests, including an Authorization token obtained from a cookie.
 *
 * @returns {Promise<Object>} - A promise that resolves to an object containing the headers.
 */
export async function getHeaders() {
    const token = UserSession.data.token;

    const headers = {
        Accept: "application/json",
        Authorization: token,
        "Content-Type": "application/json",
    };

    return headers;
}

async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 9000 } = options;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    console.log(resource);
    const response = await fetch(resource, {
        ...options,
        signal: controller.signal,
    });
    clearTimeout(id);

    return response;
}

export async function fetchApi(path = "", method = "get", body = null, returnType = "text", header = true) {
    // debug(String(typeof body));
    const origin = location.origin;
    // debug(origin);
    path = origin + path;
    const _token = ` ${UserSession.data.token}`;
    const headers_json = {
        accept: "application/json",
        Authorization: _token,
        "Content-Type": "application/json",
    };
    const headers_form = {
        accept: "application/json",
        Authorization: _token,
        // 'Content-Type': 'multipart/form-data',
    };

    let headers = headers_json;
    if (typeof body == "object") {
        // debug("multipart/form-data")
        headers = headers_form;
    }

    let response = null;
    try {
        if (header) {
            response = await fetchWithTimeout(path, {
                method: method,
                headers: headers,
                body: body,
            });
        } else {
            response = await fetchWithTimeout(path, {
                method: method,
                headers: headers,
                mode: "no-cors",
                body: body,
            });
        }
    } catch (err) {
        printWarn("fetchApi not response or error: " + err);
        return null;
    } finally {
        //swal.close();
    }

    switch (response.status) {
        case 401:
            debug(response.status);
            toastr_notify({ icon: "error", title: "Oops... session expires or user not allow" });
            localStorage.removeItem("UserSession");
            sessionStorage.clear();
            location.replace("/");
            break;
        case 200:
            if (returnType === "text") {
                let _t = await response.text();
                return _t;
            }
            if (returnType === "json") {
                let data = await response.json();
                //debug(data);
                data.status = response.status;
                return data;
            }
            break;
        // case 422:
        //     debug(response);
        //     await Swal.fire({
        //         icon: "error",
        //         title: "422",
        //         text: response.statusText,
        //         footer: "ข้อผิดพลาด ระบบทำงานพกพร่องโปรดแจ้งเจ้าหน้าที่ให้แก้ไขครับ....!",
        //     });
        //     break;
        // case 500:
        //     await Swal.fire({
        //         icon: "error",
        //         title: "Status 500 !",
        //         text: "ข้อผิดพลาด...ระบบ!",
        //         footer: "ข้อผิดพลาด ระบบทำงานพกพร่องโปรดแจ้งเจ้าหน้าที่ให้แก้ไขครับ....!",
        //     });

        //     break;

        default:
            // debug(response)
            const msg_resp = await response.text();
            // toastr_notify({ icon: "error", title: "ข้อผิดพลาด", msg: msg_resp });
            response.msg = response.status + " : " + msg_resp;
            break;
    }
    return response;
}

export function updateElementContent(containerId, data) {
    let container = null;
    if (typeof containerId === "string" || containerId instanceof String) {
        container = document.getElementById(containerId);
        // debug(container);
    } else {
        container = containerId;
    }
    if (!container) return;

    Object.keys(data).forEach((key) => {
        const element = container.querySelector(`[name="${key}"]`);
        if (element) {
            updateElementBasedOnType(element, data[key]);
        }
    });
}

/**
 * Updates an HTML element based on its type with the given value.
 *
 * @param {HTMLElement} element - The HTML element to be updated. Must be a valid DOM element.
 * @param {string} value - The value to set on the element. The interpretation of this value depends on the element type:
 *   - For <input> and <textarea> elements, this sets the `value` property.
 *   - For <img> elements, this sets the `src` attribute, with a fallback to "/static/image/no_image.png" if the value is falsy.
 *   - For other elements, this sets the `innerHTML` property.
 *
 */
export function updateElementBasedOnType(element, value) {
    switch (element.tagName.toLowerCase()) {
        case "input":
        case "textarea":
            if (element.name == "password") {
                element.value = "";
            } else {
                element.value = value;
            }

            break;
        case "img":
            element.src = value || "/static/image/no_image.png";
            break;
            // case "p":
            //     element.innerHTML = value || "-";
            break;
        case "select":
            value = String(value);
            if (value == "true") {
                value = "ENABLE";
            }
            if (value == "false") {
                value = "DISABLE";
            }
            debug(value.split(","));
            $(element).val(value.split(",")).trigger("change"); // Notify any JS components that the value changed
            break;
        case "div":
            // case "p":
            try {
                if (element.dataset.datetime == "true" && value) {
                    const v = value.split("T");
                    element.innerHTML = `<div>
                                            <div>${v[0]} </div>
                                            <div>${v[1].split(".")[0]} </div>
                                        </div>`;
                } else {
                    element.innerHTML = value;
                }
            } catch (error) {
                element.innerHTML = value;
            }
            break;
        default:
            element.innerHTML = value;
            break;
    }
}

export async function clearValidation(formEle) {
    const elements = formEle.querySelectorAll("input, img, select,textarea");
    for (const element of elements) {
        if (element.name) {
            if (["INPUT", "SELECT", "TEXTAREA"].includes(element.tagName)) {
                element.classList.remove("is-invalid");
            }
        }
    }
}

/**
 * Extracts data from form elements and maps them to a FormData object.
 *
 * @param {HTMLFormElement} formEle - The HTML form element to extract data from.
 * @param {boolean} [validation=true] - Indicates whether form validation should be performed.
 * @returns {Promise<FormData|null>} - A promise that resolves to a FormData object if validation succeeds, otherwise null.
 */
export async function mapToFormApi(formEle, validation = true) {
    let validationSuccess = true;
    const formData = new FormData();
    const elements = formEle.querySelectorAll("input, img, select,textarea");
    for (const element of elements) {
        if (element.name) {
            const key = element.name;
            const value = element.value;

            if (element.tagName === "IMG") {
                if (element.src.startsWith("data:image")) {
                    formData.append(key, await dataURLtoFile(element.src, key));
                } else {
                    continue;
                }
            } else {
                if (["INPUT", "SELECT", "TEXTAREA"].includes(element.tagName) && validation) {
                    element.classList.remove("is-invalid");
                    if (!value && element.required) {
                        element.classList.add("is-invalid");
                        validationSuccess = false;
                    }
                }
                if (element.name === "password" && element.value === "*") {
                    // ingnr password
                    continue;
                }
                if (element.tagName === "SELECT") {
                    const selected = Array.from(element.options)
                        .filter(function (option) {
                            return option.selected;
                        })
                        .map(function (option) {
                            return option.value;
                        });
                    formData.append(key, selected);
                    continue;
                }

                formData.append(key, value);
            }
        }
    }
    // debugForm(formData);
    return validationSuccess ? formData : null;
}

/**
 * Clears the values of input fields and image elements within a given form.
 *
 * @param {HTMLFormElement} formEle - The HTML form element to clear.
 * @param {string[]} [disabled=[]] - An array of input names to be excluded from clearing.
 */
export function clearForm(formEle, disabled = []) {
    // debug(formEle);
    const elements = formEle.querySelectorAll("input,img,textarea,select,span");
    for (const element of elements) {
        if (element.name && !disabled.includes(element.name)) {
            switch (element.tagName) {
                case "INPUT":
                case "TEXTAREA":
                    element.value = "";
                    break;
                case "IMG":
                    element.src = "/static/image/Image_not_available.png";
                    break;
                case "SELECT":
                    // $(element).val(null).trigger("change");
                    break;
                default:
                    break;
            }
        } else {
            // debug(element.dataset);
            if (element.dataset.info == "") {
                // debug(element.tagName);
                element.innerHTML = "";
            }
        }
    }
}

/**
 * Populates a select element with options.
 * @param {HTMLSelectElement} selectElement - The select element to populate.
 * @param {string[]} options - Array of option values to populate.
 */
export function populateSelectElement(selectElement, options) {
    if (!selectElement) return;

    // Clear existing options
    selectElement.innerHTML = "";

    // Populate the select element with new options
    options.forEach((optionValue) => {
        const option = document.createElement("option");
        option.value = optionValue;
        option.textContent = optionValue;
        // option.classList.add("text-primary");
        selectElement.appendChild(option);
    });
}

export function daterangepicker(id) {
    $(`#${id}`).daterangepicker({
        ranges: {
            วันนี้: [moment().hour(0).minute(0), moment().hour(23).minute(59)],
            เมื่อวานนี้: [
                moment().hour(0).minute(0).subtract(1, "days"),
                moment().hour(23).minute(59).subtract(1, "days"),
            ],
            "7 วันก่อน": [moment().subtract(6, "days"), moment()],
            "30 วันก่อน": [moment().subtract(29, "days"), moment()],
            เดือนนี้: [moment().startOf("month"), moment().endOf("month")],
            เดือนก่อน: [moment().subtract(1, "month").startOf("month"), moment().subtract(1, "month").endOf("month")],
            ปีนี้: [moment().startOf("year"), moment().endOf("year")],
            ปีก่อน: [moment().subtract(1, "year").startOf("year"), moment().subtract(1, "year").endOf("year")],
        },
        timePicker24Hour: true,
        timePicker: true,
        timePickerIncrement: 1,
        locale: {
            format: "YYYY/MM/DD HH:mm",
        },
    });
    // $(`#${id}`).addClass("bg-dark");
}

export function ws_service(ws_event_subscription = null) {
    printWarn("connect WebSocket in page");
    const host_server = location.host;
    let ws_str = "wss://";
    if (location.protocol !== "https:") {
        printWarn("http in WebSocket");
        ws_str = "ws://";
    }
    let ws = new WebSocket(ws_str + host_server + "/ws");
    ws.onopen = function () {
        // toastr_notify({
        //     icon: "success",
        //     title: "ws_service",
        //     msg: "Socket is connect Successful",
        // });
        // subscribe to some channels
        // ws.send(JSON.stringify({ subscribe: UUID }));
        // print_debug(info_text(`subscribe:${UUID}`));
        //ws.send(JSON.stringify({ subscribe: "A001" }));
    };

    ws.onclose = async function (e) {
        console.log("Socket is closed. Reconnect will be attempted in 5 second.", e.reason);
        toastr_notify({
            icon: "warning",
            title: "ws_service",
            msg: "Socket is closed. Reconnect will be attempted in 15 second.",
        });
        await delay(15000);
        ws_service(ws_event_subscription);
    };

    ws.onerror = function (err) {
        console.error("Socket encountered error: ", err.message, "Closing socket");
        ws.close();
    };

    ws.onmessage = function (event) {
        let msg_from_ws = event.data;
        let json_msg = null;
        // debug(event);
        try {
            json_msg = JSON.parse(event.data);
        } catch (error) {
            printInfo(info_text(msg_from_ws));
            if (msg_from_ws == "Connect to Server Success") {
                debug("ON LINE");
            }
            if (msg_from_ws == "location.reload()") {
                location.reload();
            }
            if (msg_from_ws.startsWith("notification:")) {
                // printInfo(info_text("notification"));
                showNotification("ข้อความแจ้งเตือน", msg_from_ws);
            }
        }
        if (json_msg) {
            // printInfo(json_msg);
            if (ws_event_subscription) {
                ws_event_subscription(json_msg);
            }
        }
    };

    function sendMessage(event) {
        var input = document.getElementById("messageText");
        ws.send(input.value);
        input.value = "";
        event.preventDefault();
    }
}

export function setTheme(theme) {
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-bs-theme", theme);
    debug("setTheme :" + theme);
}

function getTheme() {
    let theme = localStorage.getItem("theme");
    if (!theme) {
        theme = "dark";
        localStorage.setItem("theme", theme);
    }
    return theme;
}

$(document).ready(function () {
    const themeSwitch = document.querySelector("#theme-switch");
    const soundSwitchControl = document.querySelector("#sound-switch-control");
    if (themeSwitch) {
        if (getTheme() == "dark") {
            themeSwitch.checked = true;
        }
        themeSwitch.addEventListener("change", () => {
            if (themeSwitch.checked) {
                setTheme("dark");
            } else {
                setTheme("light");
            }
            debug(getTheme());
        });
    }
    if (soundSwitchControl) {
        if (localStorage.getItem("sound") == null) {
            localStorage.setItem("sound", "true");
        }
        debug(localStorage.getItem("sound"));
        if (localStorage.getItem("sound") === "true") {
            soundSwitchControl.checked = true;
        } else {
            soundSwitchControl.checked = false;
        }
        debug(soundSwitchControl.checked);
        setControlSound(soundSwitchControl.checked);
    }

    document.addEventListener("click", (evnt) => {
        if (!evnt.target.parentNode) {
            return;
        }
        if (["BUTTON", "A"].includes(evnt.target.tagName) || ["BUTTON", "A"].includes(evnt.target.parentNode.tagName)) {
            btnClickSound();
        }
        // if (evnt.target.dataset.btnsound) {
        //     btnClickSound();
        // }
    });

    setTimeout(() => {
        // window.history.pushState({}, document.title, window.location.pathname);
        console.log("Load Page Successful");
        showWaitDialog(false);
    }, 1000);
});

setTheme(getTheme());
showWaitDialog(true);
