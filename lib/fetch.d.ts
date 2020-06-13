import { RequestInit } from 'node-fetch';
import Bluebird from 'bluebird';
export declare function fetch(url: string, options?: RequestInit): Bluebird<any>;
export default fetch;
