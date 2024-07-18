// App JS

import * as unity from "./unity.js";

const TOKEN_EXP = 30 * 24 * 60 * 60;
// unity.toastr_notify();
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

async function login(_user, _password, _remember_check, _app_mode, _site_name) {
    unity.debug("Login :" + _user + "@" + _password + ":" + String(_remember_check));
    const params_oauth = new URLSearchParams();
    params_oauth.append("username", _user);
    params_oauth.append("password", _password);
    params_oauth.append("app_mode", _app_mode);
    params_oauth.append("site_name", _site_name);
    params_oauth.append("remember_check", _remember_check);
    try {
        const response = await fetch("oauth", {
            method: "POST",
            body: params_oauth,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });
        const responseData = await response.json();
        unity.debug(responseData);
        if (responseData.access_token != null) {
            const token = `${responseData.token_type} ${responseData.access_token}`;

            unity.UserSession.data.siteName = _site_name;
            unity.UserSession.data.system_user_id = responseData.system_user_id;
            unity.UserSession.data.siteUser = responseData.user_name;
            unity.UserSession.data.token = token;
            unity.UserSession.data.fullName = responseData.fullName;
            unity.UserSession.saveLocalStroe();
            location.replace(`/?token=${unity.UserSession.data.token}`);
        } else {
            console.log(responseData);
            Swal.fire("ข้อผิดพลาด", String(responseData.detail), "error").then((result) => {
                return;
            });
        }
    } catch (error) {
        Swal.fire("ข้อผิดพลาด login", String(error), "error").then((result) => {
            return;
        });
    }
}

async function submit_login() {
    const _user_name = input_username_box.value;
    const _password = input_password_box.value;
    const _app_mode = input_app_mode.value;
    const _site_name = input_site_name.value;

    if (_user_name == "") {
        Swal.fire("ข้อผิดพลาด", "ข้อมูลไม่ครบ", "error").then((result) => {});
        return;
    }
    if (_password == "") {
        Swal.fire("ข้อผิดพลาด", "ข้อมูลไม่ครบ", "error").then((result) => {});
        return;
    }
    // const remember_check = document.getElementById("remember_check_box").checked;
    login(_user_name, _password, true, _app_mode, _site_name);
}

function decodeJwtResponse(token) {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
        atob(base64)
            .split("")
            .map(function (c) {
                return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join("")
    );

    return JSON.parse(jsonPayload);
}

async function handleCredentialResponse(response) {
    debug(response);
    //const responsePayload = decodeJwtResponse(response.credential);
    //console.log("ID: " + responsePayload.sub);
    //console.log('Full Name: ' + responsePayload.name);
    //console.log('Given Name: ' + responsePayload.given_name);
    //console.log('Family Name: ' + responsePayload.family_name);
    //console.log("Image URL: " + responsePayload.picture);
    //console.log("Email: " + responsePayload.email);
    const responseData = await fetchApi("/google_login", "post", JSON.stringify(response), "json");
    debug(responseData);
    const _remember_check = true;
    const _app_mode = "system";
    if (responseData.access_token != null) {
        token = `${responseData.token_type} ${responseData.access_token}`;
        console.log(_remember_check);
        if (_remember_check) {
            debug("Remember user :" + TOKEN_EXP);
        } else {
        }

        await get_user_session();
        // window.location.href = HOME_ROUTE
    } else {
        if (responseData.detail) {
            console.log(responseData);
            Swal.fire("ข้อผิดพลาด", String(responseData.detail), "error").then((result) => {
                return;
            });
        }
    }
}

const input_username_box = document.getElementById("input_username_box");
const input_password_box = document.getElementById("input_password_box");
const input_app_mode = document.getElementById("input_app_mode");
const input_site_name = document.getElementById("input_site_name");

input_username_box.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        input_password_box.focus();
    }
});

input_password_box.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        submit_login();
    }
});

document.getElementById("submit_login_btn").addEventListener("click", function () {
    console.log("submit_login_btn");
    submit_login();
});

document.getElementById("input_password_box_btn").addEventListener("click", function () {
    const _e = document.getElementById("input_password_box");
    if (_e) {
        if (_e.getAttribute("type") == "password") {
            _e.setAttribute("type", "text");
            document.getElementById("input_password_box_btn").innerHTML = `<i class="fas  fa-eye"></i>`;
        } else {
            _e.setAttribute("type", "password");
            document.getElementById("input_password_box_btn").innerHTML = `<i class="fas  fa-eye-slash"></i>`;
        }
    }
});

function appSelect(v) {
    // unity.debug(v);
    const input_username_box_from = document.getElementById("input_username_box_from");
    switch (v) {
        case "BUILDING-OWNER":
            input_username_box_from.classList.add("hidden");
            break;

        default:
            input_username_box_from.classList.remove("hidden");
            break;
    }
}
window.appSelect = appSelect;

$(document).ready(function () {
    setTimeout(async () => {
        if (unity.UserSession.data.token) {
            unity.toastr_notify({ icon: "info", msg: `Auto login <br>${unity.UserSession.data.name}` });
            await unity.delay(1500);
            window.location.replace(`/?token=${unity.UserSession.data.token}`);
        }
    }, 1000);
});
