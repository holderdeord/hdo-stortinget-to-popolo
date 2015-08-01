import Promise from 'bluebird';
import moment from 'moment';
import debug from 'debug';

import Parliament from './Parliament';
import PopIt from './PopIt';
import HDO from './HDO';

const GENDERS = {
    1: 'female',
    2: 'male'
};

const DATE_FORMAT = 'YYYY-MM-DD';

const log = debug('hdo-to-popolo:people-etl');

Promise.longStackTraces();

export default class PeopleETL {
    constructor() {
        this.parliament = new Parliament();
        this.popit = new PopIt();
        this.hdo = new HDO();
    }

    run() {
        this.parliament.allPeriods().then(periods => {
            periods.reverse();

            return Promise.map(
                [periods[periods.length - 1]],
                period => this.parliament.allRepresentatives(period.id).then(representatives => ({ period, representatives }))
            );
        }).then(periods => {
            var people = {};

            periods.forEach(item => {
                item.representatives.forEach(rep => {
                    var person = people[rep.id] || {
                        id: rep.id,
                        popoloPerson: this.convert(rep),
                        original: rep,
                        memberships: []
                    };

                    /*eslint-disable*/
                    person.memberships.push({
                        id: null,
                        legislative_period_id: item.period.id,
                        person_id: rep.id,
                        organization_id: 'stortinget',
                        on_behalf_of_id: rep.parti.id,
                        area: rep.fylke ? { id: rep.fylke.id, name: rep.fylke.name, classification: 'county' } : undefined,
                        role: 'member',
                    });
                    /*eslint-enable*/

                    people[rep.id] = person;
                });
            });

            var result = Object
                .keys(people)
                .map(k => people[k])
                .filter(p => p.popoloPerson);

            Promise.map(result, ::this.addExtraData, {concurrency: 5}).then(representatives => {
                log(JSON.stringify(representatives, null, 2));
                return Promise.map(representatives, ::this.createRepresentative, {concurrency: 5});
            });
        });
    }

    createRepresentative(rep) {
        return this.popit
            .createPerson(rep.popoloPerson)
            .then(() => Promise.map(rep.memberships, ::this.createMembership))
            .then(() => log('ok', rep.id));
    }

    createMembership(membership) {
        return this.popit.createMembership(membership);
    }

    addExtraData(rep) {
        log('addExtraData', rep.id);

        const hdo = this.hdo.representative(rep.id).then(hdoData => {
            rep.popoloPerson.links.push({
                url: hdoData._links.self.href.replace('/api', ''),
                note: 'Representative page at Holder de ord'
            });

            if (hdoData.twitter) {
                rep.popoloPerson.contact_details.push({
                    type: 'twitter',
                    label: 'Twitter account',
                    value: hdoData.twitter
                });
            }

            if (hdoData.email) {
                rep.popoloPerson.contact_details.push({
                    type: 'email',
                    label: 'Email address',
                    value: hdoData.email
                });
            }
        }).catch(err => log(err.message, err.status, err.body));

        var image = this.parliament.imageExists(rep.id).then(result => {
            if (result.exists) {
                rep.popoloPerson.image = result.url;
            }
        });

        return Promise.all([hdo, image]).then(() => rep);
    }

    convert(rep) {
        if (!rep.fylke || !rep.parti) {
            return null;
        }

        return {
            /*eslint-disable*/
            id: rep.id,
            name: rep.fornavn + ' ' + rep.etternavn,
            area: { name: rep.fylke.navn, id: rep.fylke.id },
            given_name: rep.fornavn,
            family_name: rep.etternavn,
            gender: GENDERS[rep.kjoenn],
            birth_date: moment(rep.foedselsdato).format(DATE_FORMAT),
            death_date: moment(rep.doedsdato).valueOf() !== -62135596800000 ? moment(rep.doedsdato).format(DATE_FORMAT) : undefined,
            national_identity: "Norwegian",
            links: [
                {
                    url: "https://www.stortinget.no/no/Representanter-og-komiteer/Representantene/Representantfordeling/Representant/?perid=" + rep.id,
                    note: "Norwegian Parliament page"
                }
            ],
            contact_details: []
            /*eslint-enable*/
        };
    }
}

