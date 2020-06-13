"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMegaApi = void 0;
const megajs_extra_1 = require("megajs-extra");
const bluebird_1 = __importDefault(require("bluebird"));
function getMegaApi(megaURL) {
    const api = megajs_extra_1.fromURL(megaURL.toString());
    return bluebird_1.default.props({
        api,
        file: new bluebird_1.default((resolve, reject) => {
            api.loadAttributes((error, file) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(file);
                }
            });
        })
    });
}
exports.getMegaApi = getMegaApi;
//# sourceMappingURL=api.js.map