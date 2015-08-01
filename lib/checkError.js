import debug from 'debug';

const log = debug('hdo-to-popolo:http');

export class HttpError extends Error {
    constructor(status, body) {
        const message = `request failed (${status}: ${body}`;

        super(message);

        this.name = 'HttpError';
        this.message = message;
        this.status = status;
        this.body = body;
    }
}

export default function checkError(res, body) {
    if (res.statusCode > 299 || res.statusCode < 200) {
        log(res.statusCode, body);

        throw new HttpError(res.statusCode, body);
    }

    return body;
}
