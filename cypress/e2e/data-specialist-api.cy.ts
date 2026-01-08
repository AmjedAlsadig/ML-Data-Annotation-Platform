/// <reference types="cypress" />

// cypress/e2e/data-specialist-api.cy.ts

describe("E2E – Data Specialist / Project API", () => {
  const apiBase = "http://localhost:5006";

  it("registers data_specialist, logs in and creates project", () => {
    const email = `e2e_ds_${Date.now()}@test.com`;
    const password = "password123";

    // 1) Register data specialist user
    cy.request("POST", `${apiBase}/api/auth/register`, {
      email,
      password,
      name: "DS User",
      firstName: "Data",
      lastName: "Specialist",
      role: "data_specialist",
    }).then((res) => {
      expect(res.status).to.eq(201);
    });

    // 2) Log in to obtain JWT token
    cy.request("POST", `${apiBase}/api/auth/login`, {
      email,
      password,
    }).then((res) => {
      expect(res.status).to.eq(200);
      const token = res.body.token as string;

      // 3) Create a project as data_specialist
      cy.request({
        method: "POST",
        url: `${apiBase}/api/projects`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: {
          name: `E2E Project ${Date.now()}`,
        },
        failOnStatusCode: false,
      }).then((projectRes) => {
        // backend currently returns 200 or 201 on successful project creation
        expect([200, 201]).to.include(projectRes.status);
        expect(projectRes.body).to.have.property("name");
      });
    });
  });
});
