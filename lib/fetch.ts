
import _fetch from 'cross-fetch';
import AbortController from 'abort-controller';
import { RequestInit, RequestInfo, Response } from 'node-fetch';
import Bluebird from 'bluebird';
import isErrorCode from 'is-error-code';

export function fetch(url: string,
	options?: RequestInit)
{
	options = options || {};
	options.timeout = options.timeout ?? 30;

	if (options.timeout |= 0)
	{
		const controller = new AbortController();
		const timer = setTimeout(
			() => controller.abort(),
			options.timeout,
		);

		options.signal = controller.signal;
	}

	options.redirect = 'follow';

	return Bluebird.resolve(_fetch(url, options as any))
		.tap(v => {
			if (isErrorCode(v.status))
			{
				return Promise.reject(v)
			}
		})
		.then((response) => response.json())
	;
}

export default fetch
