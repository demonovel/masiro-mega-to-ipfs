"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCache = void 0;
/**
 * Created by user on 2020/6/14.
 */
const bluebird_1 = __importDefault(require("bluebird"));
const fetch_1 = __importDefault(require("../fetch"));
const file_1 = require("./file");
const fs_extra_1 = require("fs-extra");
const util_1 = require("../util");
const url = `https://raw.githubusercontent.com/bluelovers/ws-rest/master/packages/%40demonovel/cached-data/cache/build/masiro.json`;
function updateCache(force) {
    const localFile = file_1.getLocalFilename();
    const statFile = util_1.getCacheFilename('stat.json');
    let save;
    return bluebird_1.default.resolve(fs_extra_1.readJSON(statFile))
        .then(async (st) => {
        if (!force && st && (Date.now() - st.mtimeMs) < 12 * 60 * 60 * 1000) {
            return fs_extra_1.readJSON(localFile);
        }
        return Promise.reject();
    })
        .catch(e => {
        return fetchCache()
            .tap(r => {
            save = true;
        });
    })
        .catch(e => {
        return fs_extra_1.readJSON(localFile)
            .then((json) => {
            save = true;
            return json;
        });
    })
        .catch(e => {
        save = true;
        return Promise.resolve().then(() => __importStar(require('@demonovel/cached-data/cache/build/masiro'))).then(m => m.default || m);
    })
        .tap(data => fs_extra_1.outputJSON(localFile, data, { spaces: 2 })
        .then(m => {
        save && fs_extra_1.stat(localFile)
            .then(stat => fs_extra_1.outputJSON(statFile, stat, { spaces: 2 }));
    }));
}
exports.updateCache = updateCache;
function fetchCache() {
    return bluebird_1.default
        .resolve(fetch_1.default(url));
}
exports.default = updateCache;
//# sourceMappingURL=update.js.map