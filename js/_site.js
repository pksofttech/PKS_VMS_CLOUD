import * as unity from "./unity.js";

const debug = console.log;
const from_id = "FromSiteData";
const api_path = "/api/site/";
let site_user_id = null;
export function add_new(id) {
    const _from = document.getElementById(from_id);
    unity.clearForm(_from);
}

export async function submit() {
    const _from = document.getElementById(from_id);
    const formData = await unity.mapToFormApi(_from);
    if (!formData) {
        unity.toastr_notify({ icon: "error", title: "ข้อผิดพลาด", msg: "ข้อมูลไม่ครบ" });
        return;
    }
    // unity.debugForm(formData);
    if ((await unity.dialogModal({ title: "ยืนยันทำรายการออก" })).confirm) {
        const response = await unity.fetchApi(`/api/system_user/`, "put", formData, "json");
        //debug(response);
        if (response.success) {
            debug(response);
            unity.toastr_notify({ icon: "success", title: "Successful", msg: response.msg });
        } else {
            unity.toastr_notify({ icon: "error", title: "ข้อผิดพลาด", msg: response.msg });
        }
    }
}

/**
 * Fetches and updates the dashboard data for the given ID.
 * @param {string} id - The ID of the dashboard to fetch.
 */
async function seletedDashboard(id) {
    try {
        const response = await unity.fetchApi(`${api_path}dashboard/${id}`, "get", null, "json");
        if (response.success) {
            const { name, address, site_info_data } = response.data;
            unity.updateElementContent("small_box_site_info", { name, address });
            unity.updateElementContent("small_box_site_info_data", site_info_data);
        }
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
    }
}

async function siteUserModal(id = null) {
    site_user_id = id;
    const _from = document.getElementById("ModalSiteUserAdd");
    unity.clearValidation(_from);
    if (id) {
        debug(id);
        const response = await unity.fetchApi(api_path + "site_user/" + id, "get", null, "json");
        if (response.data) {
            const d = response.data.Site_User;
            debug(d);
            unity.updateElementContent("ModalSiteUserAdd", d);
        }
    } else {
        unity.clearForm(_from);
    }
    // debug("Add Site User");
    ModalSiteUserAdd.showModal();
}

async function buildTableSiteUser() {
    const columnsTable = [
        {
            data: "Site_User.pictureUrl",
            title: "",
            orderable: false,
            render: function (data, type, row) {
                return `<div class="w-12"><img src="${data}" class="rounded-full ring-2"></div>`;
            },
        },
        {
            data: "Site_User.id",
            title: unity.dataTableHeader("จัดการ"),
            orderable: false,
            render: function (data, type, row) {
                // console.log(row);
                // if (row.Site_User.username == "system") {
                //     return `<span class="badge text-bg-danger">System</span>`;
                // }

                return `<div class="">
                            <button type="button" class="btn btn-circle btn-sm" onclick="app_event({module:'site',cmd:'site_user_edit',site_user_id:${data}})">
                                <i class="fas fa-edit text-warning"></i>
                            </button>
                            <button type="button" class="btn btn-circle btn-sm" onclick="app_event({module:'site',cmd:'site_user_remove',site_user_id:${data}})">
                            <i class="fa-solid fa-trash text-error"></i>
                            </button>
                        </div>`;
            },
        },
        {
            data: "Site_User.username",
            title: "Site_User username",
        },
        {
            data: "Site_User.full_name",
            title: "Site_User full_name",
        },
        {
            data: "Site_User.password_hash",
            title: "Site_User password_hash",
        },
        {
            data: "Site_User.is_active",
            title: "สถานะการใช้งาน",
            render: function (data, type, row) {
                if (data == true) {
                    return '<span class="badge badge-success">ปกติ</span>';
                }
                return '<span class="badge badge-danger">ระงับการใช้งาน</span>';
            },
        },
        {
            data: "Site_User.role",
            title: "Site_User role",
        },
    ];

    $("#table_site_user_managment").DataTable({
        dom: '<"top"Bf>rt<"bottom"lp>',
        buttons: [
            {
                action: function (e, dt, button, config) {
                    siteUserModal();
                },
                text: `+<i class="fas fa-user text-warning"></i>  Add Site User`,
                className: "text-warning",
            },
            "csv",
            "excel",
            "pdf",
        ],
        // columnDefs: unity.columnDefs,
        language: unity.TABLE_LANGUAGE,
        destroy: true,
        autoWidth: false,
        lengthMenu: unity.LENGTH_MENU,
        pageLength: unity.PAGE_LENGTH,
        scrollY: "50vh",
        scrollCollapse: true,
        sScrollX: "100%",
        // "paging": false
        columns: columnsTable,
        dataset: [],
        order: [[0, "desc"]],
        processing: true,
        serverSide: true,
        search: {
            return: true,
        },
        ajax: {
            headers: await unity.getHeaders(),
            type: "GET",
            url: `/api/site/user/datatable`,
            // data: function (d) {
            //     d.site_id = data_id;
            // },
            error: function (xhr, textStatus, errorThrown) {
                //window.location.reload();
                debug(textStatus);
                unity.toastr_notify({ icon: "warning", title: textStatus });
            },
        },
    });
}

async function buildTableSiteMember() {
    const columnsTable = [
        {
            data: "Site_Member.pictureUrl",
            title: "",
            orderable: false,
            render: function (data, type, row) {
                return `<div class="w-12"><img src="${data}" class="rounded-full ring-2"></div>`;
            },
        },
        {
            data: "Site_Member.id",
            title: unity.dataTableHeader("จัดการ"),
            orderable: false,
            render: function (data, type, row) {
                return `<div class="">
                            <button type="button" class="btn btn-circle btn-sm" onclick="app_event({module:'site',cmd:'site_member_edit',site_member_id:${data}})">
                                <i class="fas fa-edit text-warning"></i>
                            </button>
                            <button type="button" class="btn btn-circle btn-sm" onclick="app_event({module:'site',cmd:'site_member_remove',site_member_id:${data}})">
                            <i class="fa-solid fa-trash text-error"></i>
                            </button>
                        </div>`;
            },
        },
        {
            data: "Site_Member.username",
            title: "username",
        },
        {
            data: "Site_Member.full_name",
            title: "full_name",
        },

        {
            data: "Site_Member.is_active",
            title: "สถานะการใช้งาน",
            render: function (data, type, row) {
                if (data == true) {
                    return '<span class="badge badge-success">ปกติ</span>';
                }
                return '<span class="badge badge-danger">ระงับการใช้งาน</span>';
            },
        },
    ];

    $("#table_site_member_managment").DataTable({
        dom: '<"top"Bf>rt<"bottom"lp>',
        buttons: [
            {
                action: function (e, dt, button, config) {
                    siteUserModal();
                },
                text: `+<i class="fas fa-user text-warning"></i>  Add Site User`,
                className: "text-warning",
            },
            "csv",
            "excel",
            "pdf",
        ],
        // columnDefs: unity.columnDefs,
        language: unity.TABLE_LANGUAGE,
        destroy: true,
        autoWidth: false,
        lengthMenu: unity.LENGTH_MENU,
        pageLength: unity.PAGE_LENGTH,
        scrollY: "50vh",
        scrollCollapse: true,
        sScrollX: "100%",
        // "paging": false
        columns: columnsTable,
        dataset: [],
        order: [[0, "desc"]],
        processing: true,
        serverSide: true,
        search: {
            return: true,
        },
        ajax: {
            headers: await unity.getHeaders(),
            type: "GET",
            url: `/api/site/member/datatable`,
            // data: function (d) {
            //     d.site_id = data_id;
            // },
            error: function (xhr, textStatus, errorThrown) {
                //window.location.reload();
                debug(textStatus);
                unity.toastr_notify({ icon: "warning", title: textStatus });
            },
        },
    });
}

async function submitSiteUser() {
    const _from = document.getElementById("ModalSiteUserAdd");
    const formData = await unity.mapToFormApi(_from);
    if (!formData) {
        unity.toastr_notify({ icon: "error", title: "ข้อผิดพลาด", msg: "ข้อมูลไม่ครบ" });
        return;
    }

    if ((await unity.dialogModal({ title: "ยืนยันการทำรายการ" })).confirm) {
        let response = null;
        if (site_user_id != null) {
            response = await unity.fetchApi(api_path + "site_user/" + site_user_id, "put", formData, "json");
        } else {
            response = await unity.fetchApi(api_path + "site_user/", "post", formData, "json");
        }
        //debug(response);
        if (response.success) {
            debug(response);
            unity.toastr_notify({ icon: "success", title: "Successful", msg: response.msg });
            ModalSiteUserAdd.close("success");
        } else {
            unity.toastr_notify({ icon: "error", title: "ข้อผิดพลาด", msg: response.msg });
        }

        return response.success;
    }
}

async function removeSiteUser(id) {
    if (
        (
            await unity.dialogModal({
                title: "ยืนยันทำรายการลบข้อมูล",
                content: "การลบข้อมูลผู้ใช้งานจะมีผลต่อรายการที่ทำจากผู้ใช้งานนี้จะถูกลบทั้งหมด",
            })
        ).confirm
    ) {
        const response = await unity.fetchApi(api_path + "site_user/" + id, "delete", null, "json");
        //debug(response);
        if (response.success) {
            debug(response);
            unity.toastr_notify({ icon: "success", title: "Successful", msg: response.msg });
        } else {
            unity.toastr_notify({ icon: "error", title: "ข้อผิดพลาด", msg: response.msg });
        }

        return response.success;
    }
}

async function siteUserManagment() {
    try {
        buildTableSiteUser();
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
    }
}

export async function evenHandler(params) {
    let return_msg = null;
    switch (params.cmd) {
        case "add_new_site":
            document.getElementById("sites-select").selectedIndex = -1;
            add_new();
            set_data_id(null);
            break;

        case "submit_site_user":
            if (await submitSiteUser()) {
                buildTableSiteUser();
            }
            break;

        case "submit_site":
            if (await submit()) {
                return_msg = "reloadContent";
            }
            break;

        case "site_dashboard_selete":
            seletedDashboard(params.id);

            break;

        case "site_user_managment":
            await unity.delay(100);
            siteUserManagment();
            break;

        case "site_member_managment":
            await unity.delay(100);
            buildTableSiteMember();
            break;

        case "site_user_edit":
            siteUserModal(params.site_user_id);
            break;
        case "site_user_remove":
            debug("site_user_remove :" + params.site_user_id);
            if (await removeSiteUser(params.site_user_id)) {
                buildTableSiteUser();
            }
            break;
        default:
            unity.toastr_notify({ icon: "warning", title: "Event Not Defile", msg: params.cmd });
            break;
    }
    return return_msg;
}

debug("Load Module : _site Successful");
