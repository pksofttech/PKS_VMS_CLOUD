// *** Controljs //

const OPTION_GAUGE_BASE = {
    // renderTo: document.createElement("canvas"),
    width: 150,
    height: 150,
    units: "Voltage",
    title: "PKS",
    minValue: 0,
    maxValue: 450,
    majorTicks: ["0", "50", "100", "150", "200", "250", "300", "350", "400", "450"],
    minorTicks: 2,
    ticksAngle: 180 + 45,
    startAngle: 45,
    strokeTicks: true,
    highlights: [
        { from: 50, to: 200, color: "rgba(78,   78, 76, 0.5)" },
        { from: 200, to: 450, color: "rgba(225, 7, 23, 0.75)" },
    ],
    valueInt: 1,
    valueDec: 0,
    colorPlate: "#222222",
    colorMajorTicks: "#686868",
    colorMinorTicks: "#686868",
    colorTitle: "#eeeeee",
    colorUnits: "#eeeeee",
    colorNumbers: "#686868",
    valueBox: true,
    colorValueText: "#000000",
    colorValueBoxRect: "#ffffff",
    colorValueBoxRectEnd: "#ffffff",
    colorValueBoxBackground: "#ffffff",
    colorValueBoxShadow: false,
    colorValueTextShadow: false,
    colorNeedleShadowUp: true,
    colorNeedleShadowDown: false,
    colorNeedle: "rgba(200, 50, 50, .75)",
    colorNeedleEnd: "rgba(200, 50, 50, .75)",
    colorNeedleCircleOuter: "rgba(200, 200, 200, 1)",
    colorNeedleCircleOuterEnd: "rgba(200, 200, 200, 1)",
    borderShadowWidth: 0,
    borders: true,
    borderInnerWidth: 0,
    borderMiddleWidth: 0,
    borderOuterWidth: 5,
    colorBorderOuter: "#fafafa",
    colorBorderOuterEnd: "#cdcdcd",
    needleType: "arrow",
    needleWidth: 2,
    needleCircleSize: 7,
    needleCircleOuter: true,
    needleCircleInner: false,
    animationDuration: 1500,
    animationRule: "dequint",
    // fontNumbers: "Verdana",
    // fontTitle: "Verdana",
    // fontUnits: "Wallpoet",
    fontValue: "Wallpoet",
    // fontValueStyle: "italic",
    fontNumbersSize: 20,
    fontNumbersStyle: "italic",
    fontNumbersWeight: "bold",
    fontTitleSize: 24,
    fontUnitsSize: 22,
    fontValueSize: 50,
    animatedValue: true,
};
class appCounter extends HTMLElement {
    constructor() {
        super();
        this._counter = this.getAttribute("counter") ? this.getAttribute("counter") : 0;
        this.dis;
        this.init();
        this.addEventListener("click", (e) => {
            this.dis.innerText = ++this._counter;
        });
    }
    set counter(val) {
        this._counter = val;
        this.dis.innerText = this._counter;
    }
    get counter() {
        return this._content;
    }
    init() {
        const temp = document.getElementById("template_counter");
        const _c = temp.content.cloneNode(true);
        const _d = _c.querySelector('[name="display_data"]');
        _d.innerHTML = this._counter;
        this.dis = _d;
        this.appendChild(_c);
    }
}

class control_pilot_lamp extends HTMLElement {
    constructor() {
        super();
        this._value = false;
        this.init();
    }

    set value(val) {
        if (val) {
            this._l_on.classList.remove("hidden");
            this._l_off.classList.add("hidden");
        } else {
            this._l_off.classList.remove("hidden");
            this._l_on.classList.add("hidden");
        }
        this._value = val;
    }

    get value() {
        return this._value;
    }

    init() {
        const temp = document.getElementById("template_pilot_lamp");
        const _c = temp.content.cloneNode(true);
        this._l_on = _c.querySelector('[name="control-lamp_on"]');
        this._l_off = _c.querySelector('[name="control-lamp_off"]');
        const _c_lable = _c.querySelector('[name="label-control"]');
        if (_c_lable) {
            _c_lable.innerHTML = this.getAttribute("aria-label") ? this.getAttribute("aria-label") : "";
        }
        this.appendChild(_c);
    }
}

class control_switch extends HTMLElement {
    constructor() {
        super();
        this._value = false;
        this.callback = null;
        this._switch;
        this.init();
    }

    disabled(val) {
        this._switch.disabled = val;
    }

    value(val) {
        if (val) {
            this._switch.checked = val;
        }
        return this._switch.checked;
    }

    init() {
        const temp = document.getElementById("template_control_switch");
        const _c = temp.content.cloneNode(true);
        this._switch = _c.querySelector('[name="control-switch"]');
        const _c_lable = _c.querySelector('[name="label-control"]');
        if (_c_lable) {
            _c_lable.innerHTML = this.getAttribute("aria-label") ? this.getAttribute("aria-label") : "";
        }
        this._switch.addEventListener("change", (e) => {
            if (this.callback) {
                this.callback(this._switch.checked);
            }
        });
        this.appendChild(_c);
    }
}

class control_swap extends HTMLElement {
    constructor() {
        super();
        this._value = false;
        this.callback = null;
        this._swap_c;
        this.init();
    }
    value(val) {
        if (val) {
            this._swap_c.checked = val;
        }
        return this._swap_c.checked;
    }

    init() {
        const temp = document.getElementById("template_control_swap");
        const _c = temp.content.cloneNode(true);
        this._swap_c = _c.querySelector('[name="control-swap"]');
        const _c_lable = _c.querySelector('[name="label-control"]');
        if (_c_lable) {
            _c_lable.innerHTML = this.getAttribute("aria-label") ? this.getAttribute("aria-label") : "";
        }
        this._swap_c.addEventListener("change", (e) => {
            if (this.callback) {
                this.callback(this._swap_c.checked);
            }
        });
        this.appendChild(_c);
    }
}

class control_range extends HTMLElement {
    constructor() {
        super();
        this.init();
        this.range;
        this.callback = null;
    }
    disabled(val) {
        this.range.disabled = val;
    }
    value(val) {
        if (val) {
            this.range.value = val;
        }
        return this.range.value;
    }

    init() {
        const temp = document.getElementById("template_control_range");
        const _c = temp.content.cloneNode(true);
        const _c_lable = _c.querySelector('[name="label-control"]');
        if (_c_lable) {
            _c_lable.innerHTML = this.getAttribute("aria-label") ? this.getAttribute("aria-label") : "";
        }
        const _c_g = _c.querySelector('[name="control-range"]');
        this.range = _c_g;
        this.range.addEventListener("change", (e) => {
            if (this.callback) {
                this.callback(this.range.value);
            }
        });
        this.appendChild(_c);
    }
}

class control_gauge_ui extends HTMLElement {
    constructor() {
        super();
        this.init();
        this.gauge;
    }

    init() {
        const temp = document.getElementById("template_control_gauge_ui");
        const _c = temp.content.cloneNode(true);
        const _c_lable = _c.querySelector('[name="label-control"]');
        if (_c_lable) {
            _c_lable.innerHTML = this.getAttribute("aria-label") ? this.getAttribute("aria-label") : "";
        }
        const _c_g = _c.querySelector('[name="canvas-gauge"]');
        this.gauge = Gauge(_c_g, {
            max: 100,
            value: 50,
        });
        this.appendChild(_c);
    }
}

class control_gauge_canvas extends HTMLElement {
    constructor() {
        super();
        this._gauge;
        this.init();
        this._gauge.value = 0;
    }
    value(val) {
        if (val) {
            this._gauge.value = val;
        }
        return this._gauge.value;
    }
    init() {
        const temp = document.getElementById("template_gauge_canvas");
        const _c = temp.content.cloneNode(true);
        const _c_g = _c.querySelector('[name="canvas-gauge"]');
        const _c_lable = _c.querySelector('[name="label-control"]');
        _c_lable.innerHTML = this.getAttribute("aria-label") ? this.getAttribute("aria-label") : "";
        const _size = this.getAttribute("aria-setsize") ? this.getAttribute("aria-setsize") : "";
        const _g = { ...OPTION_GAUGE_BASE };
        if (_size != "") {
            _g.width = _size;
            _g.height = _size;
        }
        _g.renderTo = document.createElement("canvas");
        this._gauge = new RadialGauge(_g);
        _c_g.appendChild(this._gauge.options.renderTo);
        this._gauge.draw();
        this.appendChild(_c);
    }
}

window.customElements.define("app-counter", appCounter);
window.customElements.define("control-switch", control_switch);
window.customElements.define("control-swap", control_swap);
window.customElements.define("control-pilot_lamp", control_pilot_lamp);
window.customElements.define("control-range", control_range);
window.customElements.define("control-gauge_ui", control_gauge_ui);
window.customElements.define("control-gauge_canvas", control_gauge_canvas);
