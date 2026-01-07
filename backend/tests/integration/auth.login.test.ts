import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app, ready } from "../../index";

 
describe("Integration – Auth / Login", () => {
  let an_token: string;
  
  beforeAll(async () => {
    await ready;

     const anLogin = await request(app)
       .post("/api/auth/login")
       .send({ email: "an_2@test.com", password: "password123" });
 
     an_token = anLogin.body.token;
     expect(anLogin.status).toBe(200);
  });

  // ================= HAPPY PATH =================
  it("logs in with valid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "an_2@test.com",
        password: "password123",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.email).toBe("an_2@test.com");
  });

  // ================= NOT HAPPY PATH =================
  it("fails with wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "an_2@test.com",
        password: "wrong-password",
      });

    expect(res.status).toBe(401);
  });

  it("fails when user does not exist", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "missing@test.com",
        password: "password123",
      });

    expect(res.status).toBe(401);
  });

  it("fails when password is missing", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "an_2@test.com",
      });

    expect(res.status).toBe(400);
  });

  it("fails when email is missing", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        password: "password123",
      });

    expect(res.status).toBe(400);
  });

  // ================= AUTH MIDDLEWARE =================
  it("fails to access protected route without token", async () => {
    const res = await request(app)
      .get("/api/users/me"); 

    expect([401, 403, 404]).toContain(res.status);

  });
});


