// App JS

import * as unity from "./unity.js";
import * as _site from "./_site.js";
import * as _system_user from "./_system_user.js";
import * as _transaction from "./_transaction.js";

const content_app = document.getElementById("content_app");
const content_nav_bar = document.getElementById("content_nav_bar");
// const app_content = { paths: "" };

const message_dropdown_content = {
    content: document.getElementById("message_dropdown_content"),
    count: document.getElementById("message_dropdown_content_count"),
};

function event_handler_ws(e) {
    const func = e.func;
    const params = e.params;
    debug(func);
    if (func == "lpr_message") {
        debug(params);
        toastr[params.type](params.msg);
    }
    if (func == "lpr_event") {
        debug(params);
        toastr[params.toastr](`ดำเนินการรายการทางเข้า<br>${params.info}`);
        gateway_car_count();
    }
    if (func == "lpr_heartbeat") {
    }
}
unity.ws_service(event_handler_ws);

async function loadContent(pages) {
    const paths = pages.split("/");
    let page = pages;
    if (paths.length > 1) {
        page = paths[1];
    }
    // unity.debug(page);
    const _data = await unity.fetchApi(`/page/?page=${page}`, "get", null, "text");
    content_app.innerHTML = _data;
    // API PAGE INIT

    unity.debug("loadContent : " + page);

    switch (page) {
        case "site_config":
        case "devices":
            const userData = await unity.fetchApi(`/api/system_user/0`, "get", null, "json");
            const System_Users = userData.data.System_Users;
            _system_user.updateSystemUser(System_Users);
            unity.updateElementContent("FromSiteData", System_Users);
            if (page == "devices") {
                // const siteData = {};
                _transaction.buildContentOfFromTransactionIn(System_Users);
            }
        case "dashboard":
            break;
        case "reports":
            _transaction.buildTableTransaction();
            $("#daterangepicker_of_transaction").daterangepicker({
                ranges: {
                    วันนี้: [moment().hour(0).minute(0), moment().hour(23).minute(59)],
                    เมื่อวานนี้: [
                        moment().hour(0).minute(0).subtract(1, "days"),
                        moment().hour(23).minute(59).subtract(1, "days"),
                    ],
                    "7 วันก่อน": [moment().subtract(6, "days"), moment()],
                    "30 วันก่อน": [moment().subtract(29, "days"), moment()],
                    เดือนนี้: [moment().startOf("month"), moment().endOf("month")],
                    เดือนก่อน: [
                        moment().subtract(1, "month").startOf("month"),
                        moment().subtract(1, "month").endOf("month"),
                    ],
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
            break;
        case "site_user":
            app_event({ module: "site", cmd: "site_user_managment", tab: "site_user" });
            break;
        default:
            break;
    }

    $(":input").inputmask();

    // window.location.href = pages;
    window.location.hash = pages;
    content_nav_bar.innerHTML = `<a href="#" class="nav-link">${window.location.hash}</a>`;
}

let current_select_menu = null;
async function on_side_bar_event(t) {
    if (current_select_menu) {
        current_select_menu.classList.remove("active");
    }
    t.classList.add("active");
    current_select_menu = t;
    if (window.innerWidth < 800) {
        document.getElementById("menu_bar_navbar").click();
    }
    await loadContent("#!/" + t.name);
}

async function message_dropdown_btn_click() {
    unity.debug("message_dropdown_btn_click");
    message_dropdown_content.count.innerText = "0 Notifications";
    message_dropdown_content.content.innerHTML = "";
    const temp = document.getElementById("message_dropdown_content_loading");
    const clon = temp.content.cloneNode(true);
    message_dropdown_content.content.appendChild(clon);

    setTimeout(() => {
        const temp = document.getElementById("message_dropdown_content_li");
        message_dropdown_content.content.innerHTML = "";

        for (let i = 0; i < 1; i++) {
            const clon = temp.content.cloneNode(true);
            message_dropdown_content.content.appendChild(clon);
        }
    }, 1500);
}

/**
 * Reloads content based on the current URL hash.
 */
export function reloadContent() {
    loadContent(window.location.hash);
}

// Windows Export
window.message_dropdown_btn_click = message_dropdown_btn_click;
window.on_side_bar_event = on_side_bar_event;
window.toastr_notify = unity.toastr_notify;
window.app_event = app_event;

async function app_event(params) {
    try {
        if (params.module) {
            unity.debug("Event : ", params.module);
            switch (params.module) {
                case "site":
                    const return_msg_site = await _site.evenHandler(params);
                    // unity.debug("return_msg_site :" + return_msg_site);
                    // if (return_msg_site === "reloadContent") {
                    //     reloadContent();
                    // }
                    break;

                case "transaction":
                    const return_msg_transaction = await _transaction.evenHandler(params);
                    break;
                default:
                    console.error();
                    "Error Event : ", params.module;
                    break;
            }
        } else {
            switch (params.cmd) {
                case "submit_system_user":
                    if (await _system_user.submit()) {
                        // window.location.reload();
                    }
                    break;

                case "controlSoundSet":
                    unity.setControlSound(params.value);
                    break;
                case "logOut":
                    const res = await unity.dialogModal({
                        title: "ออกจากระบบ",
                    });
                    if (res.confirm) {
                        localStorage.removeItem("UserSession");
                        sessionStorage.clear();
                        location.replace("/");
                    }
                    break;
                default:
                    unity.toastr_notify({ icon: "warning", title: "Event Not Defile", msg: params.cmd });
                    break;
            }
        }
    } catch (error) {
        unity.toastr_notify({ icon: "error", title: "Status 501 !", msg: error.stack });
    }
}

async function appSetting() {
    unity.debug("*************************************");
    unity.debug("permissionDescriptors");
    const permissionDescriptors = [{ name: "camera" }];
    const permissions = await Promise.all(
        permissionDescriptors.map(async (descriptor) => ({
            descriptor,
            status: await navigator.permissions.query(descriptor),
        }))
    );
    for (const { descriptor, status } of permissions) {
        console.log(
            descriptor.name, // 'camera' | 'microphone'
            status.state // 'granted' | 'denied' | 'prompt'
        );
    }
    if (navigator.getUserMedia) {
    } else {
        unity.toastr_notify({ icon: "warning", title: "Device not support media?" });
    }
    unity.debug("*************************************");
    unity.debug(unity.silpImageBase);
    unity.silpImageBase.src = "/static/slip.png";
}
appSetting();

// $(document).ready(function () {
//     setTimeout(async () => {
//         unity.debug(unity.UserSession.data);
//     }, 1000);
// });

unity.debug("Init data load");
unity.UserSession.loadLocalStroe();
// unity.debug(unity.UserSession.data.siteName);
const dataUser = await unity.fetchApi(
    `/login_session?siteUser=${unity.UserSession.data.siteUser}`,
    "get",
    null,
    "json"
);
// debug(dataUser);
unity.UserSession.data.siteUser = dataUser.username;
unity.UserSession.data.fullName = dataUser.full_name;

if (document.getElementById("info_username-ele")) {
    document.getElementById("info_username-ele").innerHTML = unity.UserSession.data.siteUser;
}
if (document.getElementById("info_fullname-ele")) {
    document.getElementById("info_fullname-ele").innerHTML = unity.UserSession.data.fullName;
    document.getElementById("site_user_info_side_bar-ele").innerHTML = unity.UserSession.data.fullName;
    // document.getElementById("site_user_info-ele").innerHTML = unity.UserSession.data.fullName;
}

if (unity.UserSession.data.token) {
    if (window.location.hash) {
        loadContent(window.location.hash);
    } else {
        loadContent("#!/home");
    }
} else {
    unity.toastr_notify();
    location.replace(`/`);
}
