import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app, ready } from "../../index";

describe("Integration – Auth / Login", () => {
  let email: string;
  const password = "password123";

  beforeAll(async () => {
    await ready;

    email = `login_${Date.now()}@test.com`;

    // register user once
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email,
        password,
        name: "Login User",
        firstName: "Login",
        lastName: "Test",
        role: "annotator",
      });

    expect(res.status).toBe(201);
  });

  // ================= HAPPY PATH =================
  it("logs in with valid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email,
        password,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.email).toBe(email);
  });

  // ================= NOT HAPPY PATH =================
  it("fails with wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email,
        password: "wrong-password",
      });

    expect(res.status).toBe(401);
  });

  it("fails when user does not exist", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "missing@test.com",
        password,
      });

    expect(res.status).toBe(401);
  });

  it("fails when password is missing", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email,
      });

    expect(res.status).toBe(400);
  });

  it("fails when email is missing", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        password,
      });

    expect(res.status).toBe(400);
  });

  // ================= AUTH MIDDLEWARE =================
  it("fails to access protected route without token", async () => {
    const res = await request(app)
      .get("/api/users/me"); // ili bilo koja protected ruta

    expect([401, 403, 404]).toContain(res.status);

  });
});
