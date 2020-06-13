/**
 * Created by user on 2020/6/14.
 */
import Bluebird from 'bluebird';
import { IRecordCachedJSONRow } from '@demonovel/cached-data/types';
export declare function updateCache(force?: boolean): Bluebird<IRecordCachedJSONRow>;
export default updateCache;
