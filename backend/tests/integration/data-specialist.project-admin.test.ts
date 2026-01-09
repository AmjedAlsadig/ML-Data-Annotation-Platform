import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app, ready } from "../../index";
import { randomUUID } from "crypto";

describe("Integration – Projects", () => {
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


  // ======================================================
  // GET PROJECTS
  // ======================================================

  // ================= HAPPY PATH =================

  it("returns projects for data specialist", async () => {
    const res = await request(app)
      .get("/api/projects")
      .set("Authorization", `Bearer ${ds_token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("returns assigned projects for annotator", async () => {
    const res = await request(app)
      .get("/api/projects")
      .set("Authorization", `Bearer ${an_token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // ======================================================
  // DELETE PROJECT
  // ======================================================

  // ================= HAPPY PATH =================

  it("allows creator to delete their project", async () => {
    const createRes = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${ds_token}`)
      .send({ name: "Deletable Project" });

    const projectId = createRes.body.id;

    const deleteRes = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set("Authorization", `Bearer ${ds_token}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toBe("Project deleted successfully");
  });

  // ================= NOT HAPPY PATH =================

  it("rejects deletion by non-owner", async () => {
    const createRes = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${ds_token}`)
      .send({ name: "Protected Project" });

    const projectId = createRes.body.id;

    const deleteRes = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set("Authorization", `Bearer ${an_token}`);

    expect(deleteRes.status).toBe(403);
    expect(deleteRes.body.error).toContain("Access denied");
  });

  // ======================================================
  // GET PROJECT BY ID
  // ======================================================

  // ================= HAPPY PATH =================
  
  it("returns project by id", async () => {
    const createRes = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${ds_token}`)
      .send({ name: "Fetchable Project" });

    const projectId = createRes.body.id;

    const res = await request(app)
      .get(`/api/projects/${projectId}`)
      .set("Authorization", `Bearer ${ds_token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(projectId);
    createdProjectIds.push(projectId);
  });
  
  // ================= NOT HAPPY PATH =================
  it("returns 404 for non-existent project", async () => {
    const res = await request(app)
      .get("/api/projects/nonexistent-id")
      .set("Authorization", `Bearer ${ds_token}`);

    expect([400, 404]).toContain(res.status);
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
 
