/**
 * Created by user on 2020/6/14.
 */
import { getMegaApi } from './mega/api';
import { megaLink01 } from './data';
import { megaFileList, IFileChildren } from 'megajs-extra';
import { readJSON, outputJSON } from 'fs-extra';
import { getGitCacheFilename } from './util';
import { IFileRecordRow } from '@demonovel/db-api/lib/types';
import { filterList } from 'ipfs-server-list';
import Bluebird from 'bluebird';
import console from 'debug-color2/logger';
import { pokeURL } from 'poke-ipfs';
import { publishToIPFSAll } from 'fetch-ipfs/put';
import { IIPFSFileApiAddReturnEntry } from 'ipfs-types/lib/ipfs/file';
import { toLink } from 'to-ipfs-url';
import { putFileRecord } from '@demonovel/db-api';
import updateCache from './masiro/update';
import { filterEpubFiles, megaLinkFromFile } from './mega/util';

export function doTask()
{
	return getMegaApi(megaLink01)
		.then(async ({
			api,
			file,
		}) => {

			const masiro = await updateCache();

			let ret = filterEpubFiles(megaFileList(file))
				.sort((a, b) => b[1].timestamp - a[1].timestamp)
				.reduce((a, [filename, file]) =>
				{

					const name = filename.replace(/\([^()]+\)_v\d+\.\d+\.epub$/i, '');

					a[name] = {
						name,
						filename,
						file,
						timestamp: file.timestamp,
					}

					return a
				}, {})
			;



			const cache: Record<string, number> = await readJSON(getGitCacheFilename('cache.json')).catch(e => ({}));

			const cache_ipfs: Record<string, IFileRecordRow> = await readJSON(getGitCacheFilename('cache_ipfs.json'))
				.catch(e => ({}));

			let listGateway = filterList('Gateway');
			let listAPI = filterList('API');

			let index = -1;

			await Bluebird.mapSeries(Object.entries(masiro), async ([uuid, novel]) =>
				{

					// @ts-ignore
					const file = ret[novel.title]?.file;
					const { siteID, novelID, title } = novel;

					index++;

					if (file)
					{
						let timestamp = file.timestamp * 1000;

						console.dir(megaLinkFromFile(file, api as any))

						if (cache_ipfs[novelID] && cache[novelID] >= timestamp)
						{
							console.gray.info(`skip`, index, novelID, title, timestamp, cache[novelID])

							cache_ipfs[novelID] = {
								...cache_ipfs[novelID],
								data: {
									...cache_ipfs[novelID].data,
									filename: file.name,
								},
							}

							// @ts-ignore
							delete cache_ipfs[novelID].filename;

							pokeURL(cache_ipfs[novelID].data.href);

							return;
						}
						else
						{
							console.info(`start`, index, novelID, title, timestamp, cache[novelID])
						}

						await saveCache();

						console.log(`try download`, index, novelID, title)
						const buf = await new Promise<Buffer>((resolve, reject) =>
							{
								(file as IFileChildren)
									.download({}, (err, data) =>
									{
										if (err)
										{
											reject(err)
										}
										else
										{
											resolve(data);
										}
									})
								;
							})
							.catch(e => null)
						;

						if (!buf)
						{
							console.error({
								novelID,
								title,
							})

							return;
						}

						let cid: string;

						console.log(`try publish`, index, novelID, title)
						await publishToIPFSAll(buf, listAPI, {
							timeout: 30 * 1000
						})
							.each((settledResult, index) =>
							{
								// @ts-ignore
								let value: IIPFSFileApiAddReturnEntry[] = settledResult.value ?? settledResult.reason?.value;

								if (value?.length)
								{
									const { status } = settledResult;

									value.forEach((result, i) =>
									{
										const resultCID = result.cid.toString();
										if (resultCID && cid !== resultCID)
										{
											cid = resultCID;
										}
									});
								}
							})
						;

						if (!cid)
						{
							await publishToIPFSAll(buf, listAPI, {
								timeout: 30 * 1000
							})
								.each((settledResult, index) =>
								{
									// @ts-ignore
									let value: IIPFSFileApiAddReturnEntry[] = settledResult.value ?? settledResult.reason?.value;

									if (value?.length)
									{
										const { status } = settledResult;

										value.forEach((result, i) =>
										{
											const resultCID = result.cid.toString();
											if (resultCID && cid !== resultCID)
											{
												cid = resultCID;
											}
										});
									}
								})
							;
						}

						if (!cid)
						{
							console.error({
								cid,
								novelID,
								title,
							})

							return
						}

						let filename = `masiro_${novelID}.epub`;
						filename = file.name;
						let href = toLink(cid, filename);

						timestamp = Date.now();

						console.log(`try put`, index, novelID, title, cid)
						await putFileRecord({
							siteID,
							novelID,
							data: {
								timestamp: Date.now(),
								exists: true as const,
								filename: file.name,
								href,
							},
						})
							.tap(async (json) =>
							{

								cache[novelID] = timestamp;
								cache_ipfs[novelID] = json;

								listGateway
									.forEach((ipfs) => pokeURL(toLink(cid, {
										prefix: {
											ipfs,
										},
									})))
								;

								console.success(json)
							})
						;

					}
				})
				.finally(() =>
				{

					return saveCache()

				})
			;

			function saveCache()
			{
				return Promise.all([
					outputJSON(getGitCacheFilename('cache.json'), cache, {
						spaces: 2,
					}),
					outputJSON(getGitCacheFilename('cache_ipfs.json'), cache_ipfs, {
						spaces: 2,
					}),
				])
			}

		})
	;
}
