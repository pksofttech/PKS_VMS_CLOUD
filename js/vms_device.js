// App JS

import * as unity from "./unity.js";
import * as _transaction from "./_transaction.js";

const content_app = document.getElementById("content_app");
const html_body = document.getElementsByTagName("body")[0];
const html_nav_bar = document.getElementsByTagName("nav")[0];
const html_side_bar = document.getElementsByTagName("aside")[0];
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

async function on_side_bar_event(t) {
    const ul_menu = document.getElementById("sideMenuBar");
    if (ul_menu) {
        for (const _a of ul_menu.getElementsByTagName("a")) {
            _a.classList.remove("active");
        }
    }
    t.classList.add("active");
    if (window.innerWidth < 800) {
        document.getElementById("controlSideBar").click();
    }
    await loadContent("#!/" + t.name);
}

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
                case "transactionProseecss":
                    const input_card_id = document.getElementById("input_card_id-002");
                    if (input_card_id) {
                        input_card_id.value = params.id;

                        await _transaction.getTransactionOut();
                        swiper.slideTo(2, 1000, true);
                    }
                    break;

                case "view_image_info":
                    const dialog_ele = document.getElementById("DialogModal_INFO_IMAGE");
                    dialog_ele.querySelector(`[name="image_src"]`).src = document.getElementById(params.id).src;
                    DialogModal_INFO_IMAGE.showModal();
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
window.toastr_notify = unity.toastr_notify;
window.app_event = app_event;
window.on_side_bar_event = on_side_bar_event;

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

unity.debug("Init data load");
unity.UserSession.loadLocalStroe();
// unity.debug(unity.UserSession.data.siteName);
const dataUser = await unity.fetchApi(
    `/login_session?siteUser=${unity.UserSession.data.siteUser}`,
    "get",
    null,
    "json"
);
debug(dataUser);
unity.UserSession.data.siteUser = dataUser.username;
unity.UserSession.data.fullName = dataUser.full_name;

if (document.getElementById("info_username-ele")) {
    document.getElementById("info_username-ele").innerHTML = unity.UserSession.data.siteUser;
}
if (document.getElementById("info_fullname-ele")) {
    document.getElementById("info_fullname-ele").innerHTML = unity.UserSession.data.fullName;
    document.getElementById("site_user_info-ele").innerHTML = unity.UserSession.data.fullName;
}
const swiper = new Swiper(".mySwiper", {
    speed: 500,
    spaceBetween: 200,
    // loop: true,
    effect: "coverflow",
});

async function initData() {
    swiper.on("slideChangeTransitionEnd", function () {
        // unity.btnClickSound();
        unity.debug(swiper.activeIndex);
    });

    swiper.slideTo(2, 500, true);

    function populateSelectElement(selectElement, options) {
        if (!selectElement) return;
        // Clear existing options
        selectElement.innerHTML = "";

        // Populate the select element with new options
        options.forEach((optionValue) => {
            const option = document.createElement("option");
            option.value = optionValue;
            option.textContent = optionValue;
            selectElement.appendChild(option);
        });
    }
    const userData = await unity.fetchApi(`/api/system_user/0`, "get", null, "json");
    const siteData = userData.data.System_Users;
    const company = siteData.company ? siteData.company.split("\r\n") : [];
    const contacts = siteData.contacts ? siteData.contacts.split("\r\n") : [];
    const objectives = siteData.objectives ? siteData.objectives.split("\r\n") : [];

    const company_lists = document.getElementById("company_lists");
    if (company_lists) {
        populateSelectElement(company_lists, company);
    }
    const objective_lists = document.getElementById("objective_lists");
    if (objective_lists) {
        populateSelectElement(objective_lists, objectives);
    }
    const contact_lists = document.getElementById("contact_lists");
    if (contact_lists) {
        populateSelectElement(contact_lists, contacts);
    }

    app_event({ module: "transaction", cmd: "vms_device_transaction_list" });
}
initData();
