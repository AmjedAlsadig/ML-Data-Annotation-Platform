/// <reference types="cypress" />

describe("E2E – Admin login and assign-role screen", () => {
  const baseUrl = "http://localhost:5173";
  const apiBase = "http://localhost:5006";

  it("logs in as admin and opens assign-role page", () => {
    const email = `e2e_ui_admin_${Date.now()}@test.com`;
    const password = "password123";

    // 1) Create admin user via API
    cy.request("POST", `${apiBase}/api/auth/register`, {
      email,
      password,
      name: "Admin UI User",
      firstName: "Admin",
      lastName: "Tester",
      role: "admin",
    }).its("status").should("eq", 201);

    // 2) Login via UI
    cy.visit(`${baseUrl}/login`);
    cy.get('[data-testid="input-email"]').type(email);
    cy.get('[data-testid="input-password"]').type(password);
    cy.get('[data-testid="button-login"]').click();

    // 3) Redirect to /admin/assign-role
    cy.url().should("include", "/admin/assign-role");

    // 4) Basic assertion that assign-role content exists
    cy.contains(/assign role/i);
  });
});
