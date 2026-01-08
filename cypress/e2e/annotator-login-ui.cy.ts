/// <reference types="cypress" />

describe("E2E – Annotator login redirect", () => {
  const baseUrl = "http://localhost:5173";
  const apiBase = "http://localhost:5006";

  it("logs in as annotator and lands on annotator dashboard", () => {
    const email = `e2e_ui_ann_${Date.now()}@test.com`;
    const password = "password123";

    // 1) Create annotator via API
    cy.request("POST", `${apiBase}/api/auth/register`, {
      email,
      password,
      name: "Ann UI User",
      firstName: "Ann",
      lastName: "Tester",
      role: "annotator",
    }).its("status").should("eq", 201);

    // 2) Login via UI
    cy.visit(`${baseUrl}/login`);
    cy.get('[data-testid="input-email"]').type(email);
    cy.get('[data-testid="input-password"]').type(password);
    cy.get('[data-testid="button-login"]').click();

    // 3) Check redirect to annotator dashboard
    cy.url().should("include", "/annotator/dashboard");
  });
});
