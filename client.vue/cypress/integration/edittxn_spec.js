import * as shortid from 'shortid';

describe('Hitting an empty user account', () => {
    before(() => {
        cy.register();
    });
    beforeEach(() => {
        cy.setLogin();
        cy.visit('#!/editTxn');
    });

    it('tells us to create some accounts and envelopes', () => {
        cy.get('p[data-cy=no-data]').should('have.text', 'Go create some accounts and envelopes before trying to do this');
    });

    describe('when we have accounts', () => {
        before(() => {
            cy.loadAccounts(shortid.generate());
        });

        it('allows us to make transactions', () => {
            cy.get('[data-cy=edittxn-form]');
        });
    });
});