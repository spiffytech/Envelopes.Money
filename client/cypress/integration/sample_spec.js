describe('My first test', () => {
    it('Visits the kitchen', () => {
        cy.visit('https://example.cypress.io');

        cy.contains('type').click();

        cy.url().should('include', '/commands/actions')

        cy.get('.action-email').type('fake@gmail.com').should('have.value', 'fake@gmail.com')
    })
});