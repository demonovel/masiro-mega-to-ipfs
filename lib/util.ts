import { join } from "path";

export function getCacheFilename(filename: string)
{
	return join(__dirname, '../', '.cache', filename)
}

export function getGitCacheFilename(filename: string)
{
	return join(__dirname, '../', 'test', 'cache', filename)
}
