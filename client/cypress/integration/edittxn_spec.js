import * as shortid from 'shortid';

describe('Editing a txn in an empty user account', () => {
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
        
        it('lets us save the transaction', () => {
            cy.get(inputSelector).type('20');
            cy.get('input[data-cy=label]').type('FooCo');
            cy.get('select[data-cy=transaction-source]').select('Bank: 0.00');
            cy.get('[data-cy=split-data-entry] select').select('Groceries: 0.00');
            cy.get('button[type=submit]').click();

            // We should get redirected to the main page
            cy.get('button[data-cy=transactions]').click();
            cy.get('[data-cy=transaction] [data-cy=transaction-label]').first().should('contain.text', 'FooCo');
        });

        it('updates the home screen with the new envelope group balance', () => {
            cy.get('[data-cy=home-button]').click();
            cy.get('button[data-cy=accounts]', {timeout: 5000}).click();
            cy.get('[data-cy=envelope-group-null] [data-cy=total-balance]').should('have.text', 'Total balance: -20.00');
        });

        it('lets us reuse a previous payee', () => {
            cy.get('input[data-cy=label]').type('Foo');
            cy.get('[data-cy=suggested-payee]').first().click();
            cy.get(inputSelector).type('20');
            cy.get('button[type=submit]').click();
            cy.get('button[data-cy=transactions]');
        });
    });
});
