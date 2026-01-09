import request from "supertest";
import { app, ready } from "../../index";
import { randomUUID } from "crypto";  

describe("Integration – Data Specialist / Project", () => {
  let adminToken: string;
  let ds_token: string;
  let an_token: string;
  let ml_token: string;
  let imageId: string | undefined;
  let createdProjectIds: string[] = [];
  let createdLabelTypeIds: string[] = [];
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

    const dsEmail = `ds_${randomUUID()}@test.com`;
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

  it("creates a project successfully for a data specialist", async () => {
    const res = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${ds_token}`)
      .send({
        name: "Integration Project"
      });

    expect(res.status).toBe(201);
    createdProjectIds.push(res.body.id);
  });

  // ================= NOT HAPPY PATH =================
  
  it("rejects unauthenticated requests", async () => {
    const res = await request(app).post("/api/projects").send({ name: "Unauthorized" });
    expect(res.status).toBe(401);
  });

  it("rejects project creation with invalid payload", async () => {
    const res = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${ds_token}`)
      .send({});

    expect(res.status).toBe(400);
  });


  // ================= AUTOMATIC CLEANUP =================

  afterAll(async () => {
  for (const id of createdProjectIds) {
    await request(app)
      .delete(`/api/projects/${id}`)
      .set("Authorization", `Bearer ${ds_token}`);
  }
  createdProjectIds = [];

  if (createdLabelTypeIds.length) {
    await request(app)
      .delete("/api/label-types")
      .set("Authorization", `Bearer ${ds_token}`)
      .send({ ids: createdLabelTypeIds });
  }
  createdLabelTypeIds = [];

  for (const email of createdUserEmails) {
    await request(app)
      .delete("/api/users")
      .set("Authorization", `Bearer ${ds_token}`)
      .send({ email });
  }
  createdUserEmails = [];

  if (imageId) {
    await request(app)
      .delete(`/api/images/${imageId}`)
      .set("Authorization", `Bearer ${ds_token}`);
    imageId = undefined;
  }
  });
});
