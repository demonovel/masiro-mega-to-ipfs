import { fromURL, IFileLike, IFile } from 'megajs-extra';
import Bluebird from 'bluebird';

export function getMegaApi(megaURL: string | URL)
{
	const api = fromURL(megaURL.toString());

	return Bluebird.props<{
		api: IFile;
		file: IFileLike;
	}>({
		api,
		file: new Bluebird<IFileLike>((resolve, reject) => {
			api.loadAttributes((error, file) => {
				if (error)
				{
					reject(error)
				}
				else
				{
					resolve(file)
				}
			})
		})
	})
}
