"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetch = void 0;
const cross_fetch_1 = __importDefault(require("cross-fetch"));
const abort_controller_1 = __importDefault(require("abort-controller"));
const bluebird_1 = __importDefault(require("bluebird"));
const is_error_code_1 = __importDefault(require("is-error-code"));
function fetch(url, options) {
    var _a;
    options = options || {};
    options.timeout = (_a = options.timeout) !== null && _a !== void 0 ? _a : 30;
    if (options.timeout |= 0) {
        const controller = new abort_controller_1.default();
        const timer = setTimeout(() => controller.abort(), options.timeout);
        options.signal = controller.signal;
    }
    options.redirect = 'follow';
    return bluebird_1.default.resolve(cross_fetch_1.default(url, options))
        .tap(v => {
        if (is_error_code_1.default(v.status)) {
            return Promise.reject(v);
        }
    })
        .then((response) => response.json());
}
exports.fetch = fetch;
exports.default = fetch;
//# sourceMappingURL=fetch.js.map