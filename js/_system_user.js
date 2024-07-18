import * as unity from "./unity.js";

const debug = console.log;
const from_id = "FromSystemUserData";
const api_path = "/api/system_user/";
let data_id = 0;
export function set_id(id) {
    data_id = id;
}
export async function submit() {
    const _from = document.getElementById(from_id);
    const formData = await unity.mapToFormApi(_from);
    // unity.debug_form(formData);
    if (!formData) {
        unity.toastr_notify({ icon: "error", title: "ข้อผิดพลาด", msg: "ข้อมูลไม่ครบ" });
        return;
    }

    data_id = formData.get("id");
    if ((await unity.dialogModal({ title: "ยืนยันการทำรายการ", content: "บันทึกข้อมูล" })).confirm) {
        const formData = await unity.mapToFormApi(_from);
        // unity.debug_form(formData);
        const _reply = await unity.fetchApi(api_path, "put", formData, "json");
        //debug(_reply);
        if (_reply.success) {
            debug(_reply);
            unity.toastr_notify({ icon: "success", title: "Successful", msg: _reply.msg });
        } else {
            unity.toastr_notify({ icon: "error", title: "ข้อผิดพลาด", msg: _reply.msg });
        }
        return _reply.success;
    }
}

export function updateSystemUser(data) {
    // unity.debug(data);
    unity.updateElementContent(from_id, data);
}

debug("Load Module : _system_user Successful");
