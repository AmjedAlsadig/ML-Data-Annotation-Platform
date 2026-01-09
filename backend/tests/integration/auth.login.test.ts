import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app, ready } from "../../index";
import { randomUUID } from "crypto";
 
describe("Integration – Auth / Login", () => {
   let ds_token: string;
   let an_token: string;
   let ml_token: string;
   let dsEmail: string;
   let createdUserEmails: string[] = [];
 
   beforeAll(async () => {
     await ready;
 
    dsEmail = `ds_${randomUUID()}@test.com`;
     const dsRes = await request(app)
       .post("/api/auth/register")
       .send({
         email: dsEmail,
         password: "password123",
         name: "Data Specialist",
         firstName: "Data",
         lastName: "Specialist",
         role: "data_specialist",
       });
     expect(dsRes.status).toBe(201);
 
     const dsLogin = await request(app)
       .post("/api/auth/login")
       .send({ email: dsEmail, password: "password123" });
 
     ds_token = dsLogin.body.token;
     expect(dsLogin.status).toBe(200);
 
     const annEmail = `an_${randomUUID()}@test.com`;
     const anRes = await request(app)
       .post("/api/auth/register")
       .send({
         email: annEmail,
         password: "password123",
         name: "Annotator",
         firstName: "Annnotator",
         lastName: "user",
         role: "annotator",
       });
     expect(anRes.status).toBe(201);
 
     const anLogin = await request(app)
       .post("/api/auth/login")
       .send({ email: annEmail, password: "password123" });
     an_token = anLogin.body.token;
     expect(anLogin.status).toBe(200);
 
 
     const mlEmail = `ml_${randomUUID()}@test.com`;
     const mlRes = await request(app)
       .post("/api/auth/register")
       .send({
         email: mlEmail,
         password: "password123",
         name: "ML Engineer",
         firstName: "ML",
         lastName: "Engineer",
         role: "ml_engineer",
       });
     expect(mlRes.status).toBe(201);
     const mlLogin = await request(app)
       .post("/api/auth/login")
       .send({ email: mlEmail, password: "password123" });
 
     ml_token = mlLogin.body.token;
     expect(mlLogin.status).toBe(200);
 
     createdUserEmails.push(dsEmail);
     createdUserEmails.push(annEmail);
     createdUserEmails.push(mlEmail);
   });
 

  // ================= HAPPY PATH =================
  it("logs in with valid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: dsEmail,
        password: "password123",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.email).toBe(dsEmail);
  });

  // ================= NOT HAPPY PATH =================
  it("fails with wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: dsEmail,
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
        email: dsEmail,
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

  // ================= AUTOMATIC CLEANUP =================
   afterAll(async () => {
 
   for (const email of createdUserEmails) {
     await request(app)
       .delete("/api/users")
       .set("Authorization", `Bearer ${ds_token}`)
       .send({ email });
   }
   createdUserEmails = [];
   });
 });

