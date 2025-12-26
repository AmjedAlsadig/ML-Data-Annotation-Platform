describe("E2E – Auth API", () => {
  const apiBase = "http://localhost:5006";

  it("registers and logs in via API", () => {
    const email = `e2e_api_${Date.now()}@test.com`;
    const password = "password123";

    cy.request("POST", `${apiBase}/api/auth/register`, {
      email,
      password,
      name: "E2E User",
      firstName: "E2E",
      lastName: "Test",
      role: "annotator",
    }).then((res) => {
      expect(res.status).to.eq(201);
    });

    cy.request("POST", `${apiBase}/api/auth/login`, {
      email,
      password,
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.property("token");
      expect(res.body.user.email).to.eq(email);
    });
  });
});
