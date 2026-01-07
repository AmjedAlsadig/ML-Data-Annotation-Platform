import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app, ready } from "../../index";

describe("Integration – Auth / Register", () => {
  beforeAll(async () => {
    await ready;
  });

  // ================= HAPPY PATH =================
  it("registers a new user successfully", async () => {
    const email = `int_${Date.now()}@test.com`;

    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email,
        password: "password123",
        name: "Integration User",
        firstName: "Integration",
        lastName: "Test",
        role: "annotator",
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.email).toBe(email);
    expect(res.body.role).toBe("annotator");
    expect(res.body).not.toHaveProperty("password");
  });


  // ================= NOT HAPPY PATH =================
  it("rejects registration with invalid payload", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "bad@test.com" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual(
      expect.objectContaining({
        error: "Validation failed",
        details: expect.any(Array),
      })
    );
  });

  it("rejects registration when email already exists", async () => {
    const email = `ann_2@test.com`;
    const res = await request(app).post("/api/auth/register").send({
      email,
      password: "password123",
      name: "User",
      firstName: "User",
      lastName: "Two",
      role: "annotator"
    });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      error: "User with this email already exists",
    });
  });
});
