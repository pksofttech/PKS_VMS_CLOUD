// Common js for control
const debug = console.log;
toastr.options = {
    closeButton: true,
    debug: false,
    newestOnTop: false,
    progressBar: false,
    positionClass: "toast-top-right",
    preventDuplicates: false,
    onclick: null,
    showDuration: "300",
    hideDuration: "1000",
    timeOut: "5000",
    extendedTimeOut: "1000",
    showEasing: "swing",
    hideEasing: "linear",
    showMethod: "fadeIn",
    hideMethod: "fadeOut",
};

moment.locale("th");

const navbar_logout_btn = document.getElementsByName("navbar_logout_btn")[0];
// console.log(navbar_logout_btn);
if (navbar_logout_btn) {
    navbar_logout_btn.addEventListener("click", logout);
}

function buttons_datatable(header_document = null) {
    return [
        {
            text: '<i class="fa-solid fa-rotate fa-2x text-primary"></i>',
            action: function (e, dt, node, config) {
                this.ajax.reload();
            },
        },
        {
            text: `<i class="fa-solid fa-print fa-2x text-info"></i>`,
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
            text: '<i class="fa-solid fa-file-excel fa-2x text-success"></i>',
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
            text: '<i class="fa-solid fa-file-csv fa-2x text-warning"></i>',
        },
        {
            extend: "colvis",
            text: '<i class="fa-solid fa-indent fa-2x text-error"></i>',
        },
    ];
}

const message_dropdown_content = document.getElementById("message_dropdown_content");
if (message_dropdown_content) {
    message_dropdown_content.addEventListener("transitionend", (event) => {
        if (window.getComputedStyle(message_dropdown_content).visibility === "hidden") {
            message_dropdown_content.innerHTML = "";
        }
    });
}

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
        document.exitFullscreen();
    }
}

async function dataURLtoFile(data_url, filename = "img") {
    if (data_url == "") {
        print_error("data_url is null");
        return;
    }
    try {
        const blob = await (await fetch(data_url)).blob();
        return new File([blob], filename);
    } catch (error) {
        print_error(error);
        return;
    }
}

async function resizeImage(base64Str, w = 600, h = 600) {
    let img = new Image();
    img.src = base64Str;
    let canvas = document.createElement("canvas");
    const MAX_WIDTH = w;
    const MAX_HEIGHT = h;
    await img.decode();
    let width = img.naturalWidth;
    let height = img.naturalHeight;

    if ((width < MAX_WIDTH) & (height < MAX_HEIGHT)) {
        debug("Not resizeImage");
        return base64Str;
    }
    if (width > height) {
        if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
        }
    } else {
        if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
        }
    }
    canvas.width = width;
    canvas.height = height;
    let ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);
    // debug(canvas.toDataURL())
    debug("resizeImage Image");
    return canvas.toDataURL();
}

async function showPreview(event, id) {
    if (event.target.files.length > 0) {
        const preview = document.getElementById(id);
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onloadend = async function () {
            preview.src = await resizeImage(reader.result, 128, 128);
            //print_warn(preview.src)
        };
        reader.readAsDataURL(file);
    }
}

function showTime() {
    const date = new Date();
    let d = date.getDate();
    let mm = date.getMonth() + 1;
    let yyyy = date.getFullYear();
    let h = date.getHours(); // 0 - 59
    let m = date.getMinutes(); // 0 - 59
    let s = date.getSeconds(); // 0 - 59

    mm = mm < 10 ? "0" + mm : mm;
    h = h < 10 ? "0" + h : h;
    m = m < 10 ? "0" + m : m;
    s = s < 10 ? "0" + s : s;

    const _date_str = d + "/" + mm + "/" + yyyy;
    const time = h + ":" + m;
    const _date = document.getElementById("AppDateDisplay");
    const _clock = document.getElementById("AppClockDisplay");
    //debug(_clock);
    if (_date) {
        {
            _date.innerText = _date_str;
        }
    }
    if (_clock) {
        {
            _clock.innerText = time;
            // _clock.textContent = time;

            setTimeout(showTime, 10000);
        }
    }
}
showTime();

// ***  js for user

async function submit_form_me_user_setting() {
    const f = document.getElementById("form_me_user_setting");

    const username = f.querySelectorAll('[name="username"]')[0].value;
    const name = f.querySelectorAll('[name="name"]')[0].value;
    const image_upload = f.querySelectorAll('[name="image_upload"]')[0].value;

    const formData = new FormData();
    formData.append("username", username);
    formData.append("name", name);
    if (image_upload) {
        formData.append(
            "image_upload",
            await dataURLtoFile(document.getElementById("me-preview-img-of-item").src, image_upload)
        );
    }
    const _reply = await fetchApi("/api/systems_user/me", "post", formData, "json");
    if (_reply.success == true) {
        Swal.fire({
            icon: "info",
            title: "Successful",
            html: _reply.msg,
        }).then(() => {
            window.location.reload();
        });
    } else {
        debug(_reply);
        toastMixin.fire({
            title: JSON.stringify(_reply),
            icon: "error",
        });
    }
}

function active_form_me_user_setting() {
    debug("active_form_me_user_setting");
    const f = document.getElementById("form_me_user_setting");
    //const username = f.querySelectorAll('[name="username"]')[0].value;
    //const name = f.querySelectorAll('[name="name"]')[0].value;
    f.querySelectorAll('[name="image_upload"]')[0].value = "";
}

async function chang_password() {
    const { value: formValues } = await Swal.fire({
        title: "แก้ไข password",
        html: `
        <div>
            <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Old password</label>
            <input type="password" autocomplete="off" id="swal-input1"  class="input_box_form">
        </div>
        <div>
            <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">New password</label>
            <input type="password" autocomplete="off" id="swal-input2"  class="input_box_form">
        </div>
        `,

        focusConfirm: false,
        preConfirm: () => {
            return [document.getElementById("swal-input1").value, document.getElementById("swal-input2").value];
        },
    });

    if (formValues) {
        const old_password = formValues[0];
        const new_password = formValues[1];
        if (old_password == new_password) {
            return;
        }
        if (old_password == "") {
            return;
        }
        if (new_password == "") {
            return;
        }
        if (new_password.length < 7) {
            Swal.fire("password น้อยกว่า 8 ตัว");
            return;
        }

        const formData = new FormData();
        formData.append("old_password", old_password);
        formData.append("new_password", new_password);

        const _reply = await fetchApi("/api/systems_user/me_change_password", "post", formData, "json");
        if (_reply.success == true) {
            Swal.fire({
                icon: "info",
                title: "Successful",
                html: _reply.msg,
            }).then(() => {
                window.location.reload();
            });
        } else {
            debug(_reply);
            toastMixin.fire({
                title: JSON.stringify(_reply),
                icon: "error",
            });
        }
    }
}
