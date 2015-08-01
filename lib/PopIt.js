import Promise from 'bluebird';
import requestRaw from 'request';
import url from 'url';
import checkError from './checkError';
import debug from 'debug';

const log = debug('hdo-to-popolo:popit');
const request = Promise.promisify(requestRaw);

const USER_AGENT = 'hdo-stortinget-to-popolo | holderdeord.no';

export default class PopIt {
    constructor(opts) {
        opts = opts || {};
        this.host   = opts.host || 'holderdeord.popit.mysociety.org';
        this.apiKey = opts.apiKey || process.env.POPIT_API_KEY;

        if (!this.apiKey) {
            throw new Error('please provide apiKey or set POPIT_API_KEY');
        }

        this.collections = {
            persons: url.format({
                protocol: 'https',
                host: this.host,
                pathname: '/api/v0.1/persons'
            }),

            memberships: url.format({
                protocol: 'https',
                host: this.host,
                pathname: '/api/v0.1/memberships'
            }),

            organizations: url.format({
                protocol: 'https',
                host: this.host,
                pathname: '/api/v0.1/organizations'
            })
        };
    }

    reset() {
        return Promise.map(Object.keys(this.collections), key => {
            log('reset', key);

            return request({
                url: this.collections[key],
                method: 'DELETE',
                json: true,
                headers: {
                    Apikey: this.apiKey,
                    'User-Agent': USER_AGENT
                },
            }).spread(checkError);
        });
    }

    createPerson(person) {
        log('create person', person.name);

        return request({
            url: this.collections.persons,
            method: 'POST',
            json: true,
            headers: {
                Apikey: this.apiKey,
                'User-Agent': USER_AGENT
            },
            body: person
        }).spread(checkError);
    }

    createMembership(membership) {
        log('create memberships', membership.role);

        return request({
            url: this.collections.memberships,
            method: 'POST',
            json: true,
            headers: {
                Apikey: this.apiKey,
                'User-Agent': USER_AGENT
            },
            body: membership
        }).spread(checkError);
    }

    createOrganization(organization) {
        log('create org', organization);

        return request({
            url: this.collections.organizations,
            method: 'POST',
            json: true,
            headers: {
                Apikey: this.apiKey,
                'User-Agent': USER_AGENT
            },
            body: organization
        }).spread(checkError);
    }
}
