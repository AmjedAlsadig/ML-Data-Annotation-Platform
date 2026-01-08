/// <reference types="cypress" />

describe("E2E – Data Specialist UI flow", () => {
  const baseUrl = "http://localhost:5173";      // adjust if your frontend runs on a different port
  const apiBase = "http://localhost:5006";

  it("logs in as data_specialist and opens image portfolio", () => {
    const email = `e2e_ui_ds_${Date.now()}@test.com`;
    const password = "password123";

    // 1) Create a data_specialist user via API (faster and more stable than using the UI)
    cy.request("POST", `${apiBase}/api/auth/register`, {
      email,
      password,
      name: "DS UI User",
      firstName: "Data",
      lastName: "Specialist",
      role: "data_specialist",
    }).then((res) => {
      expect(res.status).to.eq(201);
    });

    // 2) Open the login page
    cy.visit(`${baseUrl}/login`);

    // 3) Fill in the login form using data-testid attributes
    cy.get('[data-testid="input-email"]').type(email);
    cy.get('[data-testid="input-password"]').type(password);
    cy.get('[data-testid="button-login"]').click();

    // 4) Check that we are on the specialist dashboard and the welcome text is rendered
    cy.url().should("include", "/specialist/dashboard");
    cy.contains(/welcome/i);                           // matches "Welcome {user?.name}"
    cy.contains(/manage your annotation projects/i);   // subtitle text

    // 5) Navigate to the Image Portfolio tab using its data-testid
    cy.get('[data-testid="tab-portfolio"]').click();

    // 6) From the portfolio tab, click the button that leads to the full portfolio page
    cy.get('[data-testid="button-view-full-portfolio"]').click();

    // 7) Verify we are on /specialist/portfolio
    cy.url().should("include", "/specialist/portfolio");
  });
});
