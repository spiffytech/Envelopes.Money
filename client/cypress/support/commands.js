// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

Cypress.Commands.add('register', () => {
    cy.exec('npm run --silent generate_test_credentials').then((result) => {
        const [email, password] = result.stdout.trim().split(',');
        Cypress.env('email', email);
        Cypress.env('password', password);

        cy.request({url: '/signup', method: 'POST', body: {email, password}}).
        then((response) => {
            Cypress.env('userId', response.body.userId);
            Cypress.env('apikey', response.body.apikey);
            window.localStorage.setItem('creds', JSON.stringify({userId: response.body.userId, apikey: response.body.apikey}))
            cy.setCookie('apikey', response.body.apikey);
        });
    });
});

Cypress.Commands.add('login', () => {
    cy.request({
        url: '/login',
        method: 'POST',
        body: {email: Cypress.env('email'), password: Cypress.env('password')}
    }).then((response) => {
        Cypress.env('userId', response.body.userId);
        Cypress.env('apikey', response.body.apikey);
        window.localStorage.setItem('creds', JSON.stringify({userId: response.body.userId, apikey: response.body.apikey}));
    });
});

Cypress.Commands.add('setLogin', () => {
    cy.window().then((window) => {
        window.localStorage.setItem(
            'creds', JSON.stringify({userId: Cypress.env('userId'), apikey: Cypress.env('apikey')})
        );
        cy.setCookie('apikey', Cypress.env('apikey'));
    });
});

Cypress.Commands.add('loadAccounts', (envelopeId) => {
    // This `visit` is necessary, otherwise we have a window object from a
    // previous test
    cy.visit('/');
    cy.window().then(async (window) => {
        console.log('Creating a test envelope');
        const graphql = window.graphql;
        let envelope = window.Envelope.mkEmptyEnvelope(graphql.userId);
        envelope = window.Envelope.setId(envelope, envelopeId);
        envelope = window.Envelope.setName(envelope, 'Existing Test Envelope');
        envelope = window.Envelope.setTarget(envelope, 2500);
        envelope = window.Envelope.setDueDate(envelope, '2019-06-15');

        await window.accountsStore.saveAccount(graphql, envelope);
    });
});