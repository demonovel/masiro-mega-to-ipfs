/**
 * Created by user on 2020/6/14.
 */
import Bluebird from 'bluebird';
import console from 'debug-color2/logger';
import fetch from '../fetch';
import { getLocalFilename } from './file';
import { stat, readJSON, outputJSON } from 'fs-extra';
import { getCacheFilename } from '../util';
import { IRecordCachedJSONRow } from '@demonovel/cached-data/types';

const url = `https://raw.githubusercontent.com/bluelovers/ws-rest/master/packages/%40demonovel/cached-data/cache/build/masiro.json`;

export function updateCache(force?: boolean): Bluebird<IRecordCachedJSONRow>
{
	const localFile = getLocalFilename()
	const statFile = getCacheFilename('stat.json')

	let save: boolean;

	return Bluebird.resolve(readJSON(statFile))
		.then(async (st) =>
		{
			if (!force && st && (Date.now() - st.mtimeMs) < 12 * 60 * 60 * 1000)
			{
				return readJSON(localFile)
			}
			return Promise.reject()
		})
		.catch(e =>
		{
			return fetchCache()
				.tap(r =>
				{
					save = true;
				})
		})
		.catch(e =>
		{
			return readJSON(localFile)
				.then((json) =>
				{
					save = true;
					return json;
				})
		})
		.catch(e =>
		{
			save = true;
			return import('@demonovel/cached-data/cache/build/masiro').then(m => m.default || m)
		})
		.tap(data => outputJSON(localFile, data, { spaces: 2 })
			.then(m =>
			{
				save && stat(localFile)
					.then(stat => outputJSON(statFile, stat, { spaces: 2 }))
			}))
		;
}

function fetchCache()
{
	return Bluebird
		.resolve<IRecordCachedJSONRow>(fetch(url))
		;
}

export default updateCache
