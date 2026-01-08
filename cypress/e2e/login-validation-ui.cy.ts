/// <reference types="cypress" />

describe("E2E – Login validation and success", () => {
  const baseUrl = "http://localhost:5173";
  const apiBase = "http://localhost:5006";

  it("rejects wrong password and accepts correct one", () => {
    const email = `e2e_login_${Date.now()}@test.com`;
    const password = "password123";

    // 1) Create data_specialist user via API
    cy.request("POST", `${apiBase}/api/auth/register`, {
      email,
      password,
      name: "Login User",
      firstName: "Login",
      lastName: "Tester",
      role: "data_specialist",
    }).its("status").should("eq", 201);

    // 2) Open login page
    cy.visit(`${baseUrl}/login`);

    // 3) Try wrong password
    cy.get('[data-testid="input-email"]').type(email);
    cy.get('[data-testid="input-password"]').type("wrong-password");
    cy.get('[data-testid="button-login"]').click();

    // Stay on login page (no redirect)
    cy.url().should("include", "/login");

    // 4) Clear fields and login with correct password
    cy.get('[data-testid="input-email"]').clear().type(email);
    cy.get('[data-testid="input-password"]').clear().type(password);
    cy.get('[data-testid="button-login"]').click();

    // 5) Successful login → specialist dashboard
    cy.url().should("include", "/specialist/dashboard");
  });
});
