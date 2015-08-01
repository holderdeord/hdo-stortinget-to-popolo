import PopIt from './PopIt';
import debug from 'debug';

import PeopleETL from './PeopleETL';
import OrganizationETL from './OrganizationETL';

const log = debug('hdo-to-popolo:cli'); // eslint-disable-line

export default class CLI {
    static run() {
        (new this()).run();
    }

    run() {
        const cmd = process.argv[2];

        switch (cmd) {
        case 'upload':
            const orgs = new OrganizationETL();
            const people = new PeopleETL();
            const popit = new PopIt();

            popit.reset()
                .then(orgs.run.bind(orgs))
                .then(people.run.bind(people));

            break;
        default:
            console.error(`unknown command: ${cmd}`); // eslint-disable-line
        }
    }
}
