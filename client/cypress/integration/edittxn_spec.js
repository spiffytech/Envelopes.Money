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

    describe('and creating a transaction', () => {
        const inputSelector = '[data-cy=split-data-entry] input';
        it('supports entering negative numbers (credits)', () => {
            cy.get(inputSelector).type('-9');
            cy.get(inputSelector).should('have.value', '-9');
            // Sum of Splits won't show unless we have an envelope selected
            cy.get('[data-cy=split-data-entry] select').select('Groceries: 0.00');
            cy.get('[data-cy=sum-of-splits]').should('have.text', 'Sum of splits: -9.00');
        });
    });
});
