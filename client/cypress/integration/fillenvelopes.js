import * as shortid from 'shortid';

describe("Filling envelopes", () => {
  describe("with an empty account", () => {
    before(() => {
      cy.clearData();
    });
    beforeEach(() => {
      cy.visit("#!/fill");
    });

    // TODO: This is waiting on us cerating the [Unallocated] envelope on
    // account creation
    it.skip("Loads the page", () => {});
  });

  describe("with a filled account", () => {
    before(() => {
        cy.clearData();
        cy.visit("#!/fill");
        cy.loadAccounts(shortid.generate());
    });
    beforeEach(() => {
      cy.visit("#!/fill");
    });

    it('shows our accounts', () => {
        cy.get('[data-cy=balance] [data-cy=account-name]').should('have.text', 'Groceries');
    });
  });
});
