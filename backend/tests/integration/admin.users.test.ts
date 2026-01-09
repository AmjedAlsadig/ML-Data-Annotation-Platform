import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app, ready } from "../../index";
import { randomUUID } from "crypto";

describe("Integration – Admin / Users", () => {
  let adminToken: string;
  let ds_token: string;
  let an_token: string;
  let ml_token: string;
  let createdUserEmails: string[] = [];

  beforeAll(async () => {
    await ready;

    const adminEmail = `admin_${randomUUID()}@test.com`;
    const adminRes = await request(app)
      .post("/api/auth/register")
      .send({
        email: adminEmail,
        password: "password123",
        name: "Admin2",
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

    const dsEmail = `ds_${randomUUID()}@test.com`;
    const dsRes = await request(app)
      .post("/api/auth/register")
      .send({
        email: dsEmail,
        password: "password123",
        name: "Data Specialist2",
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
        name: "Annotator2",
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
  it("allows an admin to list users", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty("id");
      expect(res.body[0]).toHaveProperty("email");
      expect(res.body[0]).not.toHaveProperty("password");
    }
  });

  // ================= NOT HAPPY PATH =================

  it("rejects access for non-admin users", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${an_token}`);

    expect(res.status).toBe(403);
  });

  it("rejects unauthenticated requests", async () => {
    const res = await request(app).get("/api/admin/users");
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
