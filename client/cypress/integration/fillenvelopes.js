import * as shortid from 'shortid';

describe("Filling envelopes", () => {
  describe("with an empty account", () => {
    before(() => {
      cy.register();
    });
    beforeEach(() => {
      cy.setLogin();
      cy.visit("#!/fill");
    });

    // TODO: This is waiting on us cerating the [Unallocated] envelope on
    // account creation
    it.skip("Loads the page", () => {});
  });

  describe("with a filled account", () => {
    before(() => {
        cy.register();
        cy.setLogin();
        cy.visit("#!/fill");
        cy.loadAccounts(shortid.generate());
    });
    beforeEach(() => {
      cy.setLogin();
      cy.visit("#!/fill");
    });

    it('Shows our accounts', () => {
        cy.get('[data-cy=balance] [data-cy=account-name]').should('have.text', 'Groceries');
    });
  });
});
