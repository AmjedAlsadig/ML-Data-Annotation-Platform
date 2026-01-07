import { describe, it, beforeAll, expect } from "vitest";
import { app, ready } from "../../index";
import request from "supertest";

describe("Integration – ML Engineer Endpoints", () => {
  let mlEngineerToken: string;

  beforeAll(async () => {
    await ready; 

    const mlEmail = `ml_2@test.com`;
    const password = "password123";    
    const mlLogin = await request(app)
       .post("/api/auth/login")
       .send({ email: mlEmail, password });     

    expect(mlLogin.status).toBe(200);
    mlEngineerToken = mlLogin.body.token;
  });

  // ================= HAPPY PATH =================

  it("GET /api/ML-Engineer/images – success", async () => {
    const res = await request(app)
      .get("/api/ML-Engineer/images")
      .set("Authorization", `Bearer ${mlEngineerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/ML-Engineer/images/published – success", async () => {
    const res = await request(app)
      .get("/api/ML-Engineer/images/published")
      .set("Authorization", `Bearer ${mlEngineerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    res.body.data.forEach((img: any) => expect(img.published).toBe(true));
  });

  it("GET /api/ML-Engineer/label-types – success", async () => {
    const res = await request(app)
      .get("/api/ML-Engineer/label-types")
      .set("Authorization", `Bearer ${mlEngineerToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/ML-Engineer/:id/download – success", async () => {
    // Fetch a real image ID from DB or fixture
    const imagesRes = await request(app)
      .get("/api/ML-Engineer/images")
      .set("Authorization", `Bearer ${mlEngineerToken}`);
    const imageId = imagesRes.body.data[0]?.id;

    if (!imageId) return;

    const res = await request(app)
      .get(`/api/ML-Engineer/${imageId}/download`)
      .set("Authorization", `Bearer ${mlEngineerToken}`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/image/);
  });

  it("GET /api/ML-Engineer/images/labels – success", async () => {
    // Get image IDs from DB/fixture
    const imagesRes = await request(app)
      .get("/api/ML-Engineer/images")
      .set("Authorization", `Bearer ${mlEngineerToken}`);
    const imageIds = imagesRes.body.data.map((img: any) => img.id);

    const res = await request(app)
      .get("/api/ML-Engineer/images/labels")
      .send({ imageIds })
      .set("Authorization", `Bearer ${mlEngineerToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/ML-Engineer/images/labels/:imageId – success", async () => {
    const imagesRes = await request(app)
      .get("/api/ML-Engineer/images")
      .set("Authorization", `Bearer ${mlEngineerToken}`);
    const imageId = imagesRes.body.data[0]?.id;

    if (!imageId) return;

    const res = await request(app)
      .get(`/api/ML-Engineer/images/labels/${imageId}`)
      .set("Authorization", `Bearer ${mlEngineerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.imageId).toBe(imageId);
  });

  it("GET /api/ML-Engineer/projects – success", async () => {
    const res = await request(app)
      .get("/api/ML-Engineer/projects")
      .set("Authorization", `Bearer ${mlEngineerToken}`);

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
      .set("Authorization", `Bearer ${mlEngineerToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Image not found");
  });

  it("GET /api/ML-Engineer/images/labels – invalid IDs", async () => {
    const res = await request(app)
      .get("/api/ML-Engineer/images/labels")
      .send({ imageIds: [1234] })
      .set("Authorization", `Bearer ${mlEngineerToken}`);

    expect(res.status).toBe(400);
  });

  it("GET /api/ML-Engineer/images/labels/:imageId – invalid ID", async () => {
    const res = await request(app)
      .get("/api/ML-Engineer/images/labels/@@@")
      .set("Authorization", `Bearer ${mlEngineerToken}`);

    expect(res.status).toBe(400);
  });

});

