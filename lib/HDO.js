import Promise from 'bluebird';
import requestRaw from 'request';
import checkError from './checkError';

const request = Promise.promisify(requestRaw);

export default class HDO {
    representative(idOrSlug) {
        return request(`https://www.holderdeord.no/api/representatives/${encodeURIComponent(idOrSlug)}`)
            .spread(checkError).then(JSON.parse);
    }

    party(idOrSlug) {
        return request(`https://www.holderdeord.no/api/parties/${encodeURIComponent(idOrSlug)}`)
            .spread(checkError).then(JSON.parse);
    }
}
