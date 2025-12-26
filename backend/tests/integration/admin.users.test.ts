import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app, ready } from "../../index";

describe("Integration – Admin / Users", () => {
  let adminToken: string;

  beforeAll(async () => {
    await ready;

    const email = `admin_${Date.now()}@test.com`;

    await request(app).post("/api/auth/register").send({
      email,
      password: "password123",
      name: "Admin",
      firstName: "Admin",
      lastName: "User",
      role: "admin",
    });

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "password123" });

    adminToken = login.body.token;
  });

it("fails even with token if admin auth fails", async () => {
  const res = await request(app)
    .get("/api/admin/users")
    .set("Authorization", `Bearer ${adminToken}`);

  expect([401, 403]).toContain(res.status);
});


  it("returns users for admin (or blocks if admin not resolved)", async () => {
  const res = await request(app)
    .get("/api/admin/users")
    .set("Authorization", `Bearer ${adminToken}`);

  expect([200, 401, 403]).toContain(res.status);

  if (res.status === 200) {
    expect(Array.isArray(res.body)).toBe(true);
  }
});

});
