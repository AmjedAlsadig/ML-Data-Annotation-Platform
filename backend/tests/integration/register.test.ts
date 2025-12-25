import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app, ready } from "../../index";

describe("Integration – Register API", () => {
  beforeAll(async () => {
  
    await ready;
  });

  it("registers a new user", async () => {
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
    expect(res.body).toHaveProperty("email", email);
    expect(res.body).not.toHaveProperty("password");
  });

  it("fails when required fields are missing", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email: "bad@test.com",
      });

    expect(res.status).toBe(400);
  });

  it("fails when email already exists", async () => {
    const email = `dup_${Date.now()}@test.com`;

  
    await request(app)
      .post("/api/auth/register")
      .send({
        email,
        password: "password123",
        name: "Test User",
        firstName: "Test",
        lastName: "User",
        role: "annotator",
      });

   
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email,
        password: "password123",
        name: "Test User",
        firstName: "Test",
        lastName: "User",
        role: "annotator",
      });


    expect(res.status).toBe(409);
  });
});
