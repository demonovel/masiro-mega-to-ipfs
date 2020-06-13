/**
 * Created by user on 2020/6/14.
 */

import { File, megaKeyFromFile, IFile, IFileChildren } from 'megajs-extra';
import { extname } from "path";

export function megaLinkFromFile(file: File, rootFile: File, options?: {
	gateway?: string,
})
{
	const topkey = megaKeyFromFile(rootFile);

	let downloadId: string;

	if (typeof file.downloadId === 'string')
	{
		downloadId = file.downloadId;
	}
	else
	{
		// @ts-ignore
		downloadId = file.downloadId[file.downloadId.length - 1];
	}

	return new URL(`${options?.gateway ?? `https://mega.nz/`}${(rootFile.directory
		? `folder`
		: `file`)}/${rootFile.downloadId}#${topkey}/${(file.directory ? `folder` : `file`)}/${downloadId}`).href
}

export function filterEpubFiles(listMap: Record<string, IFile | IFileChildren>): Array<[string, IFile | IFileChildren]>
{
	return Object.entries(listMap)
		.reduce((map, [filename, file]) =>
		{

			if (!file.directory && extname(filename).toLowerCase() === '.epub')
			{
				map.push([filename, file])
			}

			return map;
		}, [] as Array<[string, IFile | IFileChildren]>)
}
