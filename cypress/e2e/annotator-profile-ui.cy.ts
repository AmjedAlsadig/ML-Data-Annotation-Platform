/// <reference types="cypress" />

describe("E2E – User profile navigation", () => {
  const baseUrl = "http://localhost:5173";
  const apiBase = "http://localhost:5006";

  it("navigates from specialist dashboard to profile page", () => {
    const email = `e2e_ui_profile_${Date.now()}@test.com`;
    const password = "password123";

    // 1) Create data_specialist
    cy.request("POST", `${apiBase}/api/auth/register`, {
      email,
      password,
      name: "Profile User",
      firstName: "Profile",
      lastName: "Tester",
      role: "data_specialist",
    }).its("status").should("eq", 201);

    // 2) Login via UI
    cy.visit(`${baseUrl}/login`);
    cy.get('[data-testid="input-email"]').type(email);
    cy.get('[data-testid="input-password"]').type(password);
    cy.get('[data-testid="button-login"]').click();

    // 3) On specialist dashboard
    cy.url().should("include", "/specialist/dashboard");

    // 4) Click on user area in header to go to profile
    cy.contains(/hello/i).click(); // header has "Hello {name}", attached to profile navigation

    // 5) Verify profile page loaded
    cy.url().should("include", "/profile");
    cy.get("body").should("exist");
  });
});
