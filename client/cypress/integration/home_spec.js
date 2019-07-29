describe('Visiting the empty home page', () => {
    before(() => {
        cy.clearData();
    });
    beforeEach(() => {
        cy.visit('/');
    });

    it('contains expected elements', () => {
        cy.get('button[data-cy=accounts').should.exist;

        cy.get('button[data-cy=transactions]').click();
        cy.get('input[data-cy=transactions-search').should.exist;
        cy.get('button[data-cy=export-transactions').should.exist;
        cy.get('button[data-cy=transactions').should.exist;
    });

    it('prompts the user to add some transactions', () => {
        cy.get('button[data-cy=transactions]').click();
        cy.get('p[data-cy=no-transactions').should('have.text', 'You don\'t have any transactions yet! Go create some by clicking the button in the top-right.');
    });
});
