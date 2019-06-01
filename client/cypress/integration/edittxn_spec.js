describe('Hitting an empty account', () => {
    before(() => {
        cy.register();
    });
    beforeEach(() => {
        cy.setLogin();
        cy.visit('#!/editTxn');
    });

    it('Tells us to create some accounts and envelopes', () => {
        cy.get('p[data-cy=no-data]').should('have.text', 'Go create some accounts and envelopes before trying to do this');
    });
});