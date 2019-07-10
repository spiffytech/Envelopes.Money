import {Base64} from 'js-base64';
import * as shortid from 'shortid';

describe('Creating a new account', () => {
    before(() => {
        cy.register();
    });
    beforeEach(() => {
        cy.setLogin();
        cy.visit('#!/editAccount');
    });

    it('presents the create empty account form', () => {
        cy.get('input[data-cy=name]').should('have.value', '');
        cy.get('button[data-cy=add-tag]').should.exist;
        cy.get('input[data-cy=due-date]').should('have.value', '');
        cy.get('input[data-cy=target]').should('have.value', '');
    });

    it('saves the account if I make one', () => {
        cy.get('input[data-cy=name]').type('Test Account');
        cy.get('input[data-cy=due-date').type('2019-06-15');
        cy.get('input[data-cy=target').type('15');

        cy.get('input[data-cy=new-tag-name').type('Foo');
        cy.get('input[data-cy=new-tag-value').type('Bar');
        cy.get('button[data-cy=add-tag]').click();

        cy.get('form').submit();

        cy.get('button[data-cy=accounts]').click();
        cy.get('[data-cy=show-accounts]').click();

        cy.get('[data-cy=account][data-account-name="Test Account"]').
        within(() => {
            cy.get('[data-cy=balance-name]').should('have.text', 'Test Account');
            cy.get('[data-cy=fill-per-period]').should('have.text', '15.00');
        });
    });
});
describe('Editing an existing account', () => {
    const suffix = shortid.generate();
    before(() => {
        cy.register();
        // Necessary for us to have the right window object when loading fixtures
        cy.visit('/');
        cy.loadAccounts(suffix);
    });
    beforeEach(() => {
        cy.setLogin();
        cy.visit(`#!/editAccount/${encodeURIComponent(encodeURIComponent(`envelope/QdIXTLRgc${suffix}`))}`);
        // Page.js isn't detecting hashbang changes
        cy.reload();
    });

    it('loads the envelope', () => {
        cy.get('input[data-cy=name]').should('have.value', 'Groceries');
        cy.get('input[data-cy=due-date]').should('have.value', '2019-06-15');
        cy.get('input[data-cy=target]').should('have.value', '25');
    });
});
