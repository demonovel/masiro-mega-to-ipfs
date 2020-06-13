import { IFileLike, IFile } from 'megajs-extra';
import Bluebird from 'bluebird';
export declare function getMegaApi(megaURL: string | URL): Bluebird<{
    api: IFile;
    file: IFileLike;
}>;
