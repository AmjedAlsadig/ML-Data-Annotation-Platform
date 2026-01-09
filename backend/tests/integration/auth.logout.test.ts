import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app, ready } from "../../index";
import { randomUUID } from "crypto";  

 
describe("Integration – Auth / Logout", () => {
   let adminToken: string;
   let ds_token: string;
   let an_token: string;
   let ml_token: string;
   let dsEmail: string;
   let createdUserEmails: string[] = [];
 
   beforeAll(async () => {
     await ready;
 
     const adminEmail = `admin_${randomUUID()}@test.com`;
     const adminRes = await request(app)
       .post("/api/auth/register")
       .send({
         email: adminEmail,
         password: "password123",
         name: "Admin",
         firstName: "Admin",
         lastName: "User",
         role: "admin",
       });
     expect(adminRes.status).toBe(201);
 
     const adminLogin = await request(app)
       .post("/api/auth/login")
       .send({ email: adminEmail, password: "password123" });
 
     adminToken = adminLogin.body.token;
     expect(adminLogin.status).toBe(200);
 
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
 
     createdUserEmails.push(adminEmail);
     createdUserEmails.push(dsEmail);
     createdUserEmails.push(annEmail);
     createdUserEmails.push(mlEmail);
   });
 

  // ================= HAPPY PATH =================
  it("logs out an authenticated user successfully", async () => {
    const res = await request(app).post("/api/auth/logout");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: "Logged out successfully",
    });
  });

    it("allows logout to be called even when user is not authenticated", async () => {
    const res = await request(app).post("/api/auth/logout");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: "Logged out successfully",
    });
  });

  // ================= NOT HAPPY PATH =================
  it("invalidates the session after logout", async () => {
    const res = await request(app).get("/api/auth/me"); 
    expect(res.status).toBe(401);
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

