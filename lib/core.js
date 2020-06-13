"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.doTask = void 0;
/**
 * Created by user on 2020/6/14.
 */
const api_1 = require("./mega/api");
const data_1 = require("./data");
const megajs_extra_1 = require("megajs-extra");
const fs_extra_1 = require("fs-extra");
const util_1 = require("./util");
const ipfs_server_list_1 = require("ipfs-server-list");
const bluebird_1 = __importDefault(require("bluebird"));
const logger_1 = __importDefault(require("debug-color2/logger"));
const poke_ipfs_1 = require("poke-ipfs");
const put_1 = require("fetch-ipfs/put");
const to_ipfs_url_1 = require("to-ipfs-url");
const db_api_1 = require("@demonovel/db-api");
const update_1 = __importDefault(require("./masiro/update"));
const util_2 = require("./mega/util");
function doTask() {
    return api_1.getMegaApi(data_1.megaLink01)
        .then(async ({ api, file, }) => {
        const masiro = await update_1.default();
        let ret = util_2.filterEpubFiles(megajs_extra_1.megaFileList(file))
            .sort((a, b) => b[1].timestamp - a[1].timestamp)
            .reduce((a, [filename, file]) => {
            const name = filename.replace(/\([^()]+\)_v\d+\.\d+\.epub$/i, '');
            a[name] = {
                name,
                filename,
                file,
                timestamp: file.timestamp,
            };
            return a;
        }, {});
        const cache = await fs_extra_1.readJSON(util_1.getGitCacheFilename('cache.json')).catch(e => ({}));
        const cache_ipfs = await fs_extra_1.readJSON(util_1.getGitCacheFilename('cache_ipfs.json'))
            .catch(e => ({}));
        let listGateway = ipfs_server_list_1.filterList('Gateway');
        let listAPI = ipfs_server_list_1.filterList('API');
        let index = -1;
        await bluebird_1.default.mapSeries(Object.entries(masiro), async ([uuid, novel]) => {
            var _a;
            // @ts-ignore
            const file = (_a = ret[novel.title]) === null || _a === void 0 ? void 0 : _a.file;
            const { siteID, novelID, title } = novel;
            index++;
            if (file) {
                let timestamp = file.timestamp * 1000;
                logger_1.default.dir(util_2.megaLinkFromFile(file, api));
                if (cache_ipfs[novelID] && cache[novelID] >= timestamp) {
                    logger_1.default.gray.info(`skip`, index, novelID, title, timestamp, cache[novelID]);
                    cache_ipfs[novelID] = {
                        ...cache_ipfs[novelID],
                        data: {
                            ...cache_ipfs[novelID].data,
                            filename: file.name,
                        },
                    };
                    // @ts-ignore
                    delete cache_ipfs[novelID].filename;
                    poke_ipfs_1.pokeURL(cache_ipfs[novelID].data.href);
                    return;
                }
                else {
                    logger_1.default.info(`start`, index, novelID, title, timestamp, cache[novelID]);
                }
                await saveCache();
                logger_1.default.log(`try download`, index, novelID, title);
                const buf = await new Promise((resolve, reject) => {
                    file
                        .download({}, (err, data) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(data);
                        }
                    });
                })
                    .catch(e => null);
                if (!buf) {
                    logger_1.default.error({
                        novelID,
                        title,
                    });
                    return;
                }
                let cid;
                logger_1.default.log(`try publish`, index, novelID, title);
                await put_1.publishToIPFSAll(buf, listAPI, {
                    timeout: 30 * 1000
                })
                    .each((settledResult, index) => {
                    var _a, _b;
                    // @ts-ignore
                    let value = (_a = settledResult.value) !== null && _a !== void 0 ? _a : (_b = settledResult.reason) === null || _b === void 0 ? void 0 : _b.value;
                    if (value === null || value === void 0 ? void 0 : value.length) {
                        const { status } = settledResult;
                        value.forEach((result, i) => {
                            const resultCID = result.cid.toString();
                            if (resultCID && cid !== resultCID) {
                                cid = resultCID;
                            }
                        });
                    }
                });
                if (!cid) {
                    await put_1.publishToIPFSAll(buf, listAPI, {
                        timeout: 30 * 1000
                    })
                        .each((settledResult, index) => {
                        var _a, _b;
                        // @ts-ignore
                        let value = (_a = settledResult.value) !== null && _a !== void 0 ? _a : (_b = settledResult.reason) === null || _b === void 0 ? void 0 : _b.value;
                        if (value === null || value === void 0 ? void 0 : value.length) {
                            const { status } = settledResult;
                            value.forEach((result, i) => {
                                const resultCID = result.cid.toString();
                                if (resultCID && cid !== resultCID) {
                                    cid = resultCID;
                                }
                            });
                        }
                    });
                }
                if (!cid) {
                    logger_1.default.error({
                        cid,
                        novelID,
                        title,
                    });
                    return;
                }
                let filename = `masiro_${novelID}.epub`;
                filename = file.name;
                let href = to_ipfs_url_1.toLink(cid, filename);
                timestamp = Date.now();
                logger_1.default.log(`try put`, index, novelID, title, cid);
                await db_api_1.putFileRecord({
                    siteID,
                    novelID,
                    data: {
                        timestamp: Date.now(),
                        exists: true,
                        filename: file.name,
                        href,
                    },
                })
                    .tap(async (json) => {
                    cache[novelID] = timestamp;
                    cache_ipfs[novelID] = json;
                    listGateway
                        .forEach((ipfs) => poke_ipfs_1.pokeURL(to_ipfs_url_1.toLink(cid, {
                        prefix: {
                            ipfs,
                        },
                    })));
                    logger_1.default.success(json);
                });
            }
        })
            .finally(() => {
            return saveCache();
        });
        function saveCache() {
            return Promise.all([
                fs_extra_1.outputJSON(util_1.getGitCacheFilename('cache.json'), cache, {
                    spaces: 2,
                }),
                fs_extra_1.outputJSON(util_1.getGitCacheFilename('cache_ipfs.json'), cache_ipfs, {
                    spaces: 2,
                }),
            ]);
        }
    });
}
exports.doTask = doTask;
//# sourceMappingURL=core.js.map