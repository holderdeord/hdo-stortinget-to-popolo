import Promise from 'bluebird';
import requestRaw from 'request';
import url from 'url';
import moment from 'moment';
import checkError from './checkError';
import debug from 'debug';

const request = Promise.promisify(requestRaw);
const log = debug('hdo-to-popolo:parliament'); // eslint-disable-line

const DATE_FORMAT = 'YYYY-MM-DD';
const HOST = 'data.stortinget.no';

export default class Parliament {
    allPeriods() {
        return request({
            json: true,
            url: url.format({
                protocol: 'http',
                host: HOST,
                pathname: '/eksport/stortingsperioder',
                query: {
                    format: 'json'
                }
            })
        }).spread((res, body) => {
            checkError(res, body);

            return body.stortingsperioder_liste.map(period => {
                return {
                    id: period.id,
                    start_date: moment(period.fra).format(DATE_FORMAT), // eslint-disable-line
                    end_date: moment(period.til).format(DATE_FORMAT) // eslint-disable-line
                };
            });
        });
    }

    allParties() {
        return request({
            json: true,
            url: url.format({
                protocol: 'http',
                host: HOST,
                pathname: '/eksport/partier',
                query: {
                    format: 'json'
                }
            })
        }).spread((res, body) => {
            checkError(res, body);
            return body.partier_liste;
        });
    }

    allRepresentatives(periodId) {
        return request({
            json: true,
            url: url.format({
                protocol: 'http',
                host: HOST,
                pathname: '/eksport/representanter',
                query: {
                    format: 'json',
                    stortingsperiodeid: periodId
                }
            })
        }).spread((res, body) => {
            checkError(res, body);
            return body.representanter_liste;
        });
    }

    imageExists(personId) {
        var uri = url.format({
            protocol: 'http',
            host: HOST,
            pathname: '/eksport/personbilde',
            query: {
                personid: personId,
                storrelse: 'stor'
            }
        });

        return request({
            method: 'HEAD',
            url: uri
        }).spread(res => ({
            exists: res.statusCode === 200,
            url: uri
        }));
    }
}
