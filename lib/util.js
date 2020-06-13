"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGitCacheFilename = exports.getCacheFilename = void 0;
const path_1 = require("path");
function getCacheFilename(filename) {
    return path_1.join(__dirname, '../', '.cache', filename);
}
exports.getCacheFilename = getCacheFilename;
function getGitCacheFilename(filename) {
    return path_1.join(__dirname, '../', 'test', 'cache', filename);
}
exports.getGitCacheFilename = getGitCacheFilename;
//# sourceMappingURL=util.js.map