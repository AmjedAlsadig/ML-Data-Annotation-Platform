// cypress/e2e/admin-access-api.cy.ts

describe("E2E – Admin access control via API", () => {
  const apiBase = "http://localhost:5006";

  it("blocks annotator from accessing /api/admin/users", () => {
    const email = `e2e_ann_${Date.now()}@test.com`;
    const password = "password123";

    // 1) Register annotator user
    cy.request("POST", `${apiBase}/api/auth/register`, {
      email,
      password,
      name: "Ann User",
      firstName: "Ann",
      lastName: "Tester",
      role: "annotator",
    }).then((res) => {
      expect(res.status).to.eq(201);
    });

    // 2) Log in as annotator
    cy.request("POST", `${apiBase}/api/auth/login`, {
      email,
      password,
    }).then((res) => {
      expect(res.status).to.eq(200);
      const token = res.body.token as string;

      // 3) Try to call admin-only route with annotator token
      cy.request({
        method: "GET",
        url: `${apiBase}/api/admin/users`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        failOnStatusCode: false,
      }).then((adminRes) => {
        // here we explicitly expect access to be forbidden
        expect(adminRes.status).to.eq(403);
      });
    });
  });
});
