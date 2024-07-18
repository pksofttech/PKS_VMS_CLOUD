import * as unity from "./unity.js";
import * as _helper from "./_helper.js";

const debug = console.log;
const from_id = "FromTransactionData";
const FromTransactionDataOut = "FromTransactionDataOut";
const vmsSlipRegistor = "vmsSlipRegistor";
const api_path = "/api/transaction/";
let data_id = null;

let transaction_id = 0;
export function set_id(id) {
    data_id = id;
}

export async function submit() {
    const _from = document.getElementById(from_id);
    const formData = await unity.mapToFormApi(_from);
    if (!formData) {
        unity.toastr_notify({ icon: "error", title: "ข้อผิดพลาด", msg: "ข้อมูลไม่ครบ" });
        return;
    }
    // data_id = formData.get("id");
    if ((await unity.dialogModal({ title: "ยืนยันการทำรายการ" })).confirm) {
        const formData = await unity.mapToFormApi(_from);
        formData.append("site_user_id", 1);
        formData.append("create_by", unity.UserSession.data.name);
        unity.debugForm(formData);
        unity.showWaitDialog(true);
        let _reply = null;
        if (data_id != null) {
            _reply = await unity.fetchApi(api_path + data_id, "put", formData, "json");
        } else {
            _reply = await unity.fetchApi(api_path, "post", formData, "json");
        }
        await unity.delay(1000);
        unity.showWaitDialog(false);
        debug(_reply);
        const data = _reply.data;
        if (_reply.success) {
            debug(data);
            // await buildTableTransaction_List();
            _helper.generateSlip(data);
            unity.toastr_notify({ icon: "success", title: "Successful", msg: _reply.msg });
            document.getElementById(vmsSlipRegistor).scrollIntoView();
            setTimeout(() => {
                buildTableTransaction_List();
            }, 1000);
        } else {
            unity.toastr_notify({ icon: "error", title: "ข้อผิดพลาด", msg: _reply.msg });
            if (data) {
                ModalTrancastionInfo.showModal();
                data.title = "รายการนี้ทำรายการแล้ว";
                unity.updateElementContent("ModalTrancastionInfo", data);
            }
        }
        return _reply.success;
    }
}

export async function viewSlipt() {
    const data = {};
    _helper.generateSlip(data);
}

export async function buildTableTransaction_List() {
    const columnsTable = [
        // {
        //     data: "Transaction.id",
        //     orderable: false,
        //     render: function (data, type) {
        //         const _data = `<button type="button" class="btn btn-circle btn-sm" onclick="app_event({module:'transaction', cmd:'transactionEdit',id:${data}});"><i class="fa-solid fa-pen-to-square text-primary"></i></button>`;
        //         return String(_data);
        //     },
        // },
        {
            data: null,
            // title: "รายการข้อมูล",
            orderable: false,
            render: function (data, type) {
                debug(data);
                const Transaction = data.Transaction;
                const info_in = `<br>${Transaction.create_date.split(".")[0]} <br>โดย ${data.create_by}`;
                const info_stamp = Transaction.stamp_date
                    ? `<br>${Transaction.stamp_date.split(".")[0]} <br>โดย ${data.stamp_by}`
                    : " - ";
                const contentHtml = `
                  <div class="stat">
                  <div class="stat-desc text-secondary text-ellipsis overflow-hidden">สถานะ : ${Transaction.status}</div>
                    <div class="stat-figure text-secondary">
                        <div class="avatar">
                            <div class="w-16 rounded-box">
                            <img src="${Transaction.image_in_url}" onerror="this.src='/static/image/Image_not_available.png'" />
                            </div>
                        </div>
                    </div>
                    <div class="stat-title">${Transaction.name}</div>
                    <div class="stat-desc text-secondary text-ellipsis overflow-hidden border rounded-btn p-1 ">ทำรายการเข้า :${info_in}</div>
                    <div class="stat-desc text-warning text-ellipsis overflow-hidden border rounded-btn p-1 ">ประทับตรา :${info_stamp}</div>
                    
                    <div class="stat-desc">
                        <div class="join gap-1 mt-1">
                            <button type="button" class="btn btn-primary btn-sm w-fit" onclick="app_event({module:'transaction', cmd:'transactionEdit',id:${Transaction.id}});">ดูรายการ</button>
                            <button type="button" class="btn btn-warning btn-sm w-fit" onclick="app_event({cmd:'transactionProseecss',id:'${Transaction.card_id}'});">ทำรายการ</button>
                        </div>
                    </div>
                </div>
                `;
                return contentHtml;
            },
        },
    ];

    $("#table_transaction_list").DataTable({
        dom: '<"top"f>rt<"bottom"lp>',
        // buttons: buttons_datatable(header_document, footer_document),
        buttons: [
            {
                text: `<button class="btn btn-outline btn-sm btn-warning">Reload</button>`,
                action: function (e, dt, node, config) {
                    this.ajax.reload();
                },
            },
        ],
        // buttons: unity.datatableButton(),

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
            url: `/api/transaction_datatable`,
            // data: function (d) {
            //     d.site_id = site_id;
            // },
            error: function (xhr, textStatus, errorThrown) {
                //window.location.reload();
                debug(textStatus);
                unity.toastr_notify({
                    icon: "error",
                    title: "ข้อผิดพลาด",
                });
            },
        },
    });
}

export async function buildTableTransaction() {
    const columnsTable = [
        {
            data: "Transaction.id",
            title: unity.dataTableHeader("No.", "success"),
            render: function (data, type) {
                const _data = `<button type="button" class="btn btn-circle btn-sm" onclick="app_event({module:'transaction', cmd:'transactionEdit',id:${data}});"><i class="fa-solid fa-pen-to-square"></i></button>`;
                return String(_data);
            },
        },
        {
            data: "Transaction.status",
            title: "สถานะ",
            render: function (data, type) {
                if (data == "REGISTERED") {
                    return `<span class="badge badge-sm badge-warning">${data}</span> `;
                }
                return `<span class="badge badge-sm badge-success">${data}</span> `;
            },
        },
        {
            data: "Transaction.create_date",
            title: "เวลาเข้า",
            render: function (data, type) {
                const dateTime = data.split(".")[0].split("T");
                const warp_datatime = `
                <div class="flex flex-col gap-1">
					<div class="badge badge-sm badge-success">${dateTime[0]}</div>
					<div class="badge badge-sm badge-info">${dateTime[1]}</div>
				</div>`;
                return warp_datatime;
            },
        },
        {
            data: "Transaction",
            title: "เวลาอยู่ในพื้นที่",
            render: function (data, type) {
                const _data = unity.timeDifferenceToString(new Date(data.create_date), new Date());
                return String(_data);
            },
        },
        {
            data: "Transaction.card_id",
            title: unity.dataTableHeader("Card ID"),
        },
        {
            data: "Transaction.name",
            title: "ชื่อ-นามสกุล",
        },
        {
            data: "Transaction.tel",
            title: "Transaction tel",
        },
        {
            data: "Transaction.company",
            title: "บริษัท/สังกัด",
        },
        {
            data: "Transaction.contacts",
            title: "Transaction contacts",
        },
        {
            data: "Transaction.objective",
            title: "Transaction objective",
        },

        {
            data: "create_by",
            title: "Transaction create_by",
        },
        {
            data: "Transaction.stamp_date",
            title: "Transaction stamp_date",
        },
        {
            data: "stamp_by",
            title: "Transaction stamp_by",
        },
        {
            data: "success_by",
            title: "Transaction success_by",
        },
        {
            data: "Transaction.success_date",
            title: "Transaction success_date",
        },
    ];

    $("#table_transaction").DataTable({
        dom: '<"top"iBf>rt<"bottom"lp>',
        // buttons: buttons_datatable(header_document, footer_document),
        // buttons: ["csv", "excel", "pdf", "print", "colvis"],
        buttons: unity.datatableButton(),

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
            url: `/api/transaction_datatable`,
            // data: function (d) {
            //     d.site_id = site_id;
            // },
            error: function (xhr, textStatus, errorThrown) {
                //window.location.reload();
                debug(textStatus);
                unity.toastr_notify({
                    icon: "error",
                    title: "ข้อผิดพลาด",
                });
            },
        },
    });
}

export async function buildTableTransactionRecord() {
    const buildTableTransactionDataRange = document.getElementById("daterangepicker_of_transaction").value;
    const columnsTable = [
        {
            data: "Transaction_Record.id",
            title: unity.dataTableHeader("No.", "success"),
            render: function (data, type) {
                const _data = `<div class="btn-group" role="group" >
                                    <button type="button" class="btn btn-circle btn-sm" onclick="app_event({module:'transaction', cmd:'transactionRecordEdit',id:${data}});"><i class="fa-solid fa-pen-to-square"></i></button>
                                    <button type="button" class="btn btn-circle btn-sm" onclick="app_event({module:'transaction', cmd:'transactionRecordPrint',id:${data}});"><i class="fa-solid fa-print"></i></button>
                                    <button type="button" class="btn btn-circle btn-sm"  onclick="app_event({module:'transaction', cmd:'transactionRecordRemove',id:${data}});"><i class="fa-solid fa-trash"></i></button>
                                </div>`;
                return String(_data);
            },
        },
        {
            data: "Transaction_Record.card_id",
            title: unity.dataTableHeader("Card ID"),
        },
        {
            data: "Transaction_Record.name",
            title: "name",
        },
        {
            data: "Transaction_Record.tel",
            title: "tel",
        },
        {
            data: "Transaction_Record.car_type",
            title: "car_type",
        },
        {
            data: "Transaction_Record.company",
            title: "บริษัท/สังกัด",
        },
        {
            data: "Transaction_Record.contacts",
            title: "contacts",
        },
        {
            data: "Transaction_Record.objective",
            title: "objective",
        },
        {
            data: "Transaction_Record",
            title: "เวลาอยู่ในพื้นที่",
            render: function (data, type) {
                const _data = unity.timeDifferenceToString(new Date(data.create_date), new Date(data.success_date));
                return String(_data);
            },
        },
        {
            data: "Transaction_Record.create_date",
            title: "create_date",
        },
        {
            data: "create_by",
            title: "create_by",
        },
        {
            data: "Transaction_Record.stamp_date",
            title: "stamp_date",
        },
        {
            data: "stamp_by",
            title: "stamp_by",
        },
        {
            data: "success_by",
            title: "success_by",
        },
        {
            data: "Transaction_Record.success_date",
            title: "success_date",
        },
        {
            data: "Transaction_Record.status",
            title: "status",
        },
    ];

    $("#table_transaction_record").DataTable({
        dom: '<"top"iBf>rt<"bottom"lp>',
        // buttons: buttons_datatable(header_document, footer_document),
        // buttons: ["csv", "excel", "pdf", "print", "colvis"],
        buttons: unity.datatableButton(),

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
            url: `/api/transaction_record_datatable`,
            data: function (d) {
                d.date_range = buildTableTransactionDataRange;
            },
            error: function (xhr, textStatus, errorThrown) {
                //window.location.reload();
                debug(textStatus);
                unity.toastr_notify({
                    icon: "error",
                    title: "ข้อผิดพลาด",
                });
            },
        },
    });
}

export async function buildContentOfFromTransactionIn(siteData) {
    try {
        // Split the contracs and objectives strings into arrays
        const company = siteData.contacts ? siteData.company.split("\r\n") : [];
        const contracs = siteData.contacts ? siteData.contacts.split("\r\n") : [];
        const objectives = siteData.objectives ? siteData.objectives.split("\r\n") : [];

        const formElement = document.getElementById("FromTransactionData");
        unity.populateSelectElement(formElement.querySelector('[name="company"]'), company);
        unity.populateSelectElement(formElement.querySelector('[name="contacts"]'), contracs);
        unity.populateSelectElement(formElement.querySelector('[name="objective"]'), objectives);
    } catch (error) {
        console.error("Error fetching site data:", error);
    }
}

async function transactionEdit(id, type = "transaction") {
    const _reply = await unity.fetchApi(`api/${type}/${id}`, "get", null, "json");
    if (_reply.success) {
        debug(_reply.data);
        const data = _reply.data;
        const Transaction = data.Transaction ? data.Transaction : data.Transaction_Record;
        Transaction.create_by = data.create_by;
        Transaction.stamp_by = data.stamp_by;
        Transaction.success_by = data.success_by;
        transaction_id = Transaction.id;
        _reply.data.title = "รายการข้อมูล";
        unity.updateElementContent("ModalTrancastionInfo", Transaction);
        ModalTrancastionInfo.showModal();
    } else {
        unity.toastr_notify({ icon: "error", title: "แจ้งเตือน", msg: _reply.msg });
    }
}

export async function getTransactionOut(card_id = null) {
    const _form = document.getElementById(FromTransactionDataOut);
    if (card_id == null) {
        card_id = _form.querySelector(`[name="card_id"]`).value;
    }
    if (card_id) {
        document.getElementById("submit_transaction_stamp_btn").disabled = true;
        document.getElementById("submit_transaction_checkout_btn").disabled = true;
        unity.clearForm(_form);
        const card_ids = card_id.split(":");
        if (card_ids[1] === undefined) {
            card_ids[0] = 0;
            card_ids[1] = card_id;
        }
        unity.showWaitDialog(true);
        transaction_id = 0;
        const _reply = await unity.fetchApi(
            // api_path + `${card_ids[0]}/?card_id=${encodeURIComponent(card_ids[1])}`,
            api_path + `/?card_id=${encodeURIComponent(card_ids[1])}`,
            "get",
            null,
            "json"
        );
        await unity.delay(1000);
        unity.showWaitDialog(false);
        if (_reply.success) {
            const data = _reply.data;
            const info = _reply.info;
            if (data) {
                document.getElementById("submit_transaction_stamp_btn").disabled = false;
                document.getElementById("submit_transaction_checkout_btn").disabled = false;
                debug(data);
                const Transaction = data.Transaction;
                Transaction.create_by = data.create_by;
                Transaction.stamp_by = data.stamp_by;
                Transaction.success_by = data.success_by;

                Transaction.create_pictureUrl = data.create_pictureUrl;
                Transaction.stamp_pictureUrl = data.stamp_pictureUrl;

                Transaction.parked = info.parked;
                transaction_id = Transaction.id;

                unity.updateElementContent(FromTransactionDataOut, Transaction);

                // document.getElementById(FromTransactionDataOut).querySelector(`[name="image_in_url"]`).scrollIntoView();
                document.getElementById("submit_transaction_checkout_btn").focus();
                // buildTableTransaction_List();
            } else {
                unity.toastr_notify({
                    icon: "warning",
                    title: "warning",
                    msg:
                        `<span class="badge text-bg-danger">ไม่มีรายการข้อมูล</span>  <br> เลขบัตรประชาชน/ใบขับขี่ <br>` +
                        card_id,
                });
            }
        } else {
            unity.toastr_notify({ icon: "error", title: "Error", msg: _reply.msg });
        }
    }
}

async function putTransactionOut({ _transaction_id = null, mode = "STAMP" }) {
    const _form = document.getElementById(FromTransactionDataOut);
    if (_transaction_id == null) {
        _transaction_id = transaction_id;
    }
    if (_transaction_id) {
        if (
            (await unity.dialogModal({ title: mode == "STAMP" ? "ยืนยันทำรายการประทับตรา" : "ยืนยันทำรายการออก" }))
                .confirm
        ) {
            unity.showWaitDialog(true);
            const formData = new FormData();
            formData.append("mode", mode);
            formData.append("site_user", unity.UserSession.data.siteUser);
            formData.append("remark", mode);
            // unity.debugForm(formData);
            const _reply = await unity.fetchApi(api_path + `${_transaction_id}`, "put", formData, "json");
            await unity.delay(500);
            unity.showWaitDialog(false);
            if (_reply.success) {
                const data = _reply.data;
                const Transaction = mode == "CHECK_OUT" ? data.Transaction_Record : data.Transaction;
                debug(Transaction);
                Transaction.create_by = data.create_by;
                Transaction.stamp_by = data.stamp_by;
                Transaction.success_by = data.success_by;
                Transaction.create_pictureUrl = data.create_pictureUrl;
                Transaction.stamp_pictureUrl = data.stamp_pictureUrl;

                if (mode == "CHECK_OUT") {
                    submit_transaction_stamp_btn;
                    document.getElementById("submit_transaction_stamp_btn").disabled = true;
                    document.getElementById("submit_transaction_checkout_btn").disabled = true;
                }
                unity.updateElementContent(FromTransactionDataOut, Transaction);
                unity.toastr_notify({
                    icon: "success",
                    title: "ทำรายการสำเร็จ",
                    msg: `<br> ${_reply.msg}<br>`,
                });
                setTimeout(() => {
                    buildTableTransaction_List();
                }, 1000);
            } else {
                unity.toastr_notify({ icon: "error", title: "Error", msg: _reply.msg });
            }
        }
    }
}

export async function evenHandler(params) {
    switch (params.cmd) {
        case "submit_transaction":
            if (await submit()) {
                // window.location.reload();
            }
            break;

        case "report_tab_selete":
            unity.debug(params.tab);
            if (params.tab == "transaction") {
                buildTableTransaction();
            }
            if (params.tab == "transaction_record") {
                buildTableTransactionRecord();
            }

            break;
        case "vms_device_transaction_list":
            buildTableTransaction_List();
            break;
        case "startWebCam":
            _helper.startWebCam();
            break;
        case "stopWebCam":
            _helper.stopWebCam();
            break;
        case "takePicture":
            _helper.takePicture(params.elementId);
            break;
        case "printSlip":
            _helper.printSlip(params.elementId);
            break;

        case "transactionEdit":
            transactionEdit(params.id);
            break;
        case "transactionRecordEdit":
            transactionEdit(params.id, "transaction_record");
            break;
        case "selectCamera":
            _helper.startWebCam(true);
            break;

        case "scanQrCode":
            _helper.scanQR(params.mode, getTransactionOut);
            break;

        case "inputCardIdKeypass":
            if (params.event.key === "Enter") {
                params.event.preventDefault();
                await getTransactionOut();
            }
            break;
        case "submit_transaction_checkout":
            if (transaction_id) {
                putTransactionOut({ mode: "CHECK_OUT" });
            } else {
                unity.toastr_notify({
                    icon: "warning",
                    title: "แจ้งเตือน",
                    msg: `<span class="badge text-bg-danger">ไม่มีรายการข้อมูล</span>  <br> เลขบัตรประชาชน/ใบขับขี่ <br>`,
                });
            }
            break;

        case "submit_transaction_stamp":
            if (transaction_id) {
                putTransactionOut({ mode: "STAMP" });
            } else {
                unity.toastr_notify({
                    icon: "warning",
                    title: "แจ้งเตือน",
                    msg: `<span class="badge text-bg-danger">ไม่มีรายการข้อมูล</span>  <br> เลขบัตรประชาชน/ใบขับขี่ <br>`,
                });
            }
            break;

        case "getTransactionOutClear":
            document.getElementById("submit_transaction_stamp_btn").disabled = true;
            document.getElementById("submit_transaction_checkout_btn").disabled = true;
            unity.clearForm(document.getElementById(FromTransactionDataOut));
            break;

        default:
            unity.toastr_notify({ icon: "warning", title: "Event Not Defile in transaction", msg: params.cmd });
            debug(params);
            break;
    }
}

debug("Load Module : _transaction Successful");

// $(document).ready(function () {
//     setTimeout(async () => {
//         await getTransactionOut("002");
//     }, 1000);
// });
