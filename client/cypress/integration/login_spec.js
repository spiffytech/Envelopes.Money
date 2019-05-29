describe('Visiting the home page', () => {
    beforeEach(() => {
        cy.visit('/');
    });

    it('redirects to the login page', () => {
        cy.url().should('include', '#!/login');
    });

    // Browser will handle rejecting for us, validate that we set that up right
    it('should reject non-emails', () => {
        cy.get('input[type=email').type('foo');
        cy.get('input[type=password').type('bar');
        cy.get('button[type=submit]').click();

        // Still on the login page
        cy.url().should('include', '#!/login');

        // We didn't reset the form
        cy.get('input[type=email').should('have.value', 'foo')
        cy.get('input[type=password').should('have.value', 'bar')
    });

    it('shouldn\'t submit if we don\'t enter a password', () => {
        cy.get('input[type=email').type('baz');
        cy.get('button[type=submit]').click();

        // Still on the login page
        cy.url().should('include', '#!/login');

        // We didn't reset the form
        cy.get('input[type=email').should('have.value', 'baz')
        cy.get('input[type=password').should('have.value', '')
    });

    it('should present an error if login credentials are invalid', () => {
        cy.get('input[type=email').type('foo@example.com');
        cy.get('input[type=password').type('bar');
        cy.get('button[type=submit]').click();

        // Still on the login page
        cy.url().should('include', '#!/login');

        // We didn't reset the form
        cy.get('input[type=email').should('have.value', 'foo@example.com')
        cy.get('input[type=password').should('have.value', 'bar')

        cy.get('.error').should('have.text', 'Invalid credentials')
    });

    it('should redirect on login', () => {
        cy.get('input[type=email').type(Cypress.env('username'));
        cy.get('input[type=password').type(Cypress.env('password'));
        cy.get('button[type=submit]').click();

        cy.url().should('include', '#!/home');
    });
});