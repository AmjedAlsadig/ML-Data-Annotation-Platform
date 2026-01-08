/// <reference types="cypress" />

describe("E2E – Data Specialist label management tab", () => {
  const baseUrl = "http://localhost:5173";
  const apiBase = "http://localhost:5006";

  it("opens the Label Management tab from dashboard", () => {
    const email = `e2e_ui_ds_labels_${Date.now()}@test.com`;
    const password = "password123";

    // 1) Create data_specialist
    cy.request("POST", `${apiBase}/api/auth/register`, {
      email,
      password,
      name: "DS Labels User",
      firstName: "Data",
      lastName: "Specialist",
      role: "data_specialist",
    }).its("status").should("eq", 201);

    // 2) Login via UI
    cy.visit(`${baseUrl}/login`);
    cy.get('[data-testid="input-email"]').type(email);
    cy.get('[data-testid="input-password"]').type(password);
    cy.get('[data-testid="button-login"]').click();

    // 3) On specialist dashboard
    cy.url().should("include", "/specialist/dashboard");

    // 4) Click Label Management tab
    cy.get('[data-testid="tab-labels"]').click();

    // 5) Assert that label manager UI is visible
    cy.contains(/label management/i);
  });
});
