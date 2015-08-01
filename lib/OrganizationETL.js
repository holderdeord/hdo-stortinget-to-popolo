import Promise from 'bluebird';
import Parliament from './Parliament';
import PopIt from './PopIt';
import HDO from './HDO';
import debug from 'debug';

const log = debug('hdo-to-popolo:organizations'); // eslint-disable-line

export default class OrganizationETL {

    constructor() {
        this.parliament = new Parliament();
        this.hdo = new HDO();
        this.popit = new PopIt();
    }

    run() {
        return Promise.join(
            this.getParties(),
            this.getLegislature(),
            (parties, legislature) => {
                return Promise.map(
                    [legislature, ...parties],
                    (org) => this.popit.createOrganization(org)
                );
            }
        );
    }

    getParties() {
        return this.parliament.allParties().then(parties => {
            return Promise.map(parties, parliamentParty => {
                const slug = parliamentParty.id.toLowerCase();

                return this.hdo.party(slug).then(party => {
                    return {
                        id: parliamentParty.id,
                        name: party.name,
                        classification: 'party',
                        image: `https://www.holderdeord.no/api/parties/${party.slug}/logo?version=medium`,
                        links: [
                            {
                                url: party._links.self.href.replace('/api', ''),
                                note: 'Party page at Holder de ord'
                            }
                        ]
                    };
                });
            });
        });
    }

    getLegislature() {
        return this.parliament.allPeriods().then(periods => {
            return {
                id: 'stortinget',
                name: 'Stortinget',
                classification: 'legislature',
                links: [
                    { url: 'http://www.stortinget.no/', note: 'Parliament website' }
                ],
                legislative_periods: periods.map(period => ({ // eslint-disable-line
                    ...period,
                    name: period.id,
                    classification: 'legislative period',
                }))
            };
        });
    }
}

