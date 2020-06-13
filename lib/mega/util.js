"use strict";
/**
 * Created by user on 2020/6/14.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterEpubFiles = exports.megaLinkFromFile = void 0;
const megajs_extra_1 = require("megajs-extra");
const path_1 = require("path");
function megaLinkFromFile(file, rootFile, options) {
    var _a;
    const topkey = megajs_extra_1.megaKeyFromFile(rootFile);
    let downloadId;
    if (typeof file.downloadId === 'string') {
        downloadId = file.downloadId;
    }
    else {
        // @ts-ignore
        downloadId = file.downloadId[file.downloadId.length - 1];
    }
    return new URL(`${(_a = options === null || options === void 0 ? void 0 : options.gateway) !== null && _a !== void 0 ? _a : `https://mega.nz/`}${(rootFile.directory
        ? `folder`
        : `file`)}/${rootFile.downloadId}#${topkey}/${(file.directory ? `folder` : `file`)}/${downloadId}`).href;
}
exports.megaLinkFromFile = megaLinkFromFile;
function filterEpubFiles(listMap) {
    return Object.entries(listMap)
        .reduce((map, [filename, file]) => {
        if (!file.directory && path_1.extname(filename).toLowerCase() === '.epub') {
            map.push([filename, file]);
        }
        return map;
    }, []);
}
exports.filterEpubFiles = filterEpubFiles;
//# sourceMappingURL=util.js.map