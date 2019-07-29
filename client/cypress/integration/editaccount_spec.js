import * as shortid from 'shortid';

describe('Creating a new account', () => {
    beforeEach(() => {
        cy.clearData();
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

        cy.get('[data-cy=envelope][data-account-name="Test Account"]', {timeout: 10000}).
        within(() => {
            cy.get('[data-cy=account-name]').should('have.text', 'Test Account');
            cy.get('[data-cy=account-balance]').should('have.text', '0.00');
        });
    });
});
describe('Editing an existing account', () => {
    const suffix = shortid.generate();
    before(() => {
        // Necessary for us to have the right window object when loading fixtures
        cy.visit('/');
        cy.wait(200);
        cy.loadAccounts(suffix);
    });
    beforeEach(() => {
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
