import { describe, it, beforeAll, expect } from "vitest";
import { app, ready } from "../../index";
import request from "supertest";
import { randomUUID } from "crypto";  

describe("Integration – ML Engineer Endpoints", () => {
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
        name: "Admin5",
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
        name: "Data Specialist5",
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
        name: "Annotator5",
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
        name: "ML Engineer5",
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

      // create image
      const uniqueSuffix = `${randomUUID()}_${Math.random().toString(36).slice(2)}`;
      const filename = `img_${uniqueSuffix}.jpg`;
      const buffer = Buffer.from(`fake-image-${uniqueSuffix}`);
      const imageRes = await request(app)
        .post("/api/images/upload")
        .set("Authorization", `Bearer ${ds_token}`)
        .attach("images", buffer, filename);
    
      expect([200, 201]).toContain(imageRes.status);
      imageId = imageRes.body.images[0].id;
      expect(imageId).toBeDefined();
  });

  // ================= HAPPY PATH =================

  it("GET /api/ML-Engineer/images – success", async () => {
    const res = await request(app)
      .get("/api/ML-Engineer/images")
      .set("Authorization", `Bearer ${ml_token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/ML-Engineer/images/published – success", async () => {
    const res = await request(app)
      .get("/api/ML-Engineer/images/published")
      .set("Authorization", `Bearer ${ml_token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    res.body.data.forEach((img: any) => expect(img.published).toBe(true));

    console.log(res.body.data);
  });

  it("GET /api/ML-Engineer/label-types – success", async () => {
    const res = await request(app)
      .get("/api/ML-Engineer/label-types")
      .set("Authorization", `Bearer ${ml_token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/ML-Engineer/:id/download – success", async () => {
    // Fetch a real image ID from DB or fixture
    const imagesRes = await request(app)
      .get("/api/ML-Engineer/images")
      .set("Authorization", `Bearer ${ml_token}`);
    const testimageId = imagesRes.body.data[0]?.id;

    if (!testimageId) return;

    const res = await request(app)
      .get(`/api/ML-Engineer/${testimageId}/download`)
      .set("Authorization", `Bearer ${ml_token}`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/image/);
  });

  it("GET /api/ML-Engineer/images/labels – success", async () => {
    // Get image IDs from DB/fixture
    const imagesRes = await request(app)
      .get("/api/ML-Engineer/images")
      .set("Authorization", `Bearer ${ml_token}`);
    const imageIds = imagesRes.body.data.map((img: any) => img.id);

    const res = await request(app)
      .get("/api/ML-Engineer/images/labels")
      .send({ imageIds })
      .set("Authorization", `Bearer ${ml_token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/ML-Engineer/images/labels/:imageId – success", async () => {
    const imagesRes = await request(app)
      .get("/api/ML-Engineer/images")
      .set("Authorization", `Bearer ${ml_token}`);
    const imageId = imagesRes.body.data[0]?.id;

    if (!imageId) return;

    const res = await request(app)
      .get(`/api/ML-Engineer/images/labels/${imageId}`)
      .set("Authorization", `Bearer ${ml_token}`);

    expect(res.status).toBe(200);
    expect(res.body.imageId).toBe(imageId);
  });

  it("GET /api/ML-Engineer/projects – success", async () => {
    const res = await request(app)
      .get("/api/ML-Engineer/projects")
      .set("Authorization", `Bearer ${ml_token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // ================= NOT HAPPY PATH =================

  it("GET /api/ML-Engineer/images – unauthorized", async () => {
    const res = await request(app).get("/api/ML-Engineer/images");
    expect(res.status).toBe(401);
  });

  it("GET /api/ML-Engineer/:id/download – not found", async () => {
    const res = await request(app)
      .get("/api/ML-Engineer/00000000-0000-0000-0000-000000000000/download")
      .set("Authorization", `Bearer ${ml_token}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Image not found");
  });

  it("GET /api/ML-Engineer/images/labels – invalid IDs", async () => {
    const res = await request(app)
      .get("/api/ML-Engineer/images/labels")
      .send({ imageIds: [1234] })
      .set("Authorization", `Bearer ${ml_token}`);

    expect(res.status).toBe(400);
  });

  it("GET /api/ML-Engineer/images/labels/:imageId – invalid ID", async () => {
    const res = await request(app)
      .get("/api/ML-Engineer/images/labels/@@@")
      .set("Authorization", `Bearer ${ml_token}`);

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
