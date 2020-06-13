/**
 * Created by user on 2020/6/14.
 */
import { File, IFile, IFileChildren } from 'megajs-extra';
export declare function megaLinkFromFile(file: File, rootFile: File, options?: {
    gateway?: string;
}): string;
export declare function filterEpubFiles(listMap: Record<string, IFile | IFileChildren>): Array<[string, IFile | IFileChildren]>;
