import { describe, it, expect, beforeAll, afterAll } from "vitest";
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
        name: "Admin700",
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
        name: "Data Specialist700",
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
        name: "Annotator700",
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
  it("creates an annotation for an authenticated user", async () => {
  // create project
  const projectRes = await request(app)
    .post("/api/projects")
    .set("Authorization", `Bearer ${an_token}`)
    .send({ name: "Annotation Project"});

  expect(projectRes.status).toBe(201);
  const projectId = projectRes.body.id;
  expect(projectId).toBeDefined();
  createdProjectIds.push(projectId);

  // create label type
  const labelTypeRes = await request(app)
    .post("/api/label-types")
    .set("Authorization", `Bearer ${an_token}`)
    .send({ name: `Dogs_${randomUUID()}`, description: "Dog labels"});

  expect(labelTypeRes.status).toBe(201);
  const labelId = labelTypeRes.body.data.id;
  expect(labelId).toBeDefined();
  createdLabelTypeIds.push(labelId);
  

  // create label class
  const labelClassRes = await request(app)
    .post(`/api/label-types/${labelId}/classes`)
    .set("Authorization", `Bearer ${ds_token}`)
    .send({ name: `Collie_${randomUUID()}`, description: "Dog labels"});

  expect(labelClassRes.status).toBe(201);
  const labelClassesId = labelClassRes.body.data.id;
  expect(labelClassesId).toBeDefined();

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

  await request(app)
    .post(`/api/projects/${projectId}/images`)
    .set("Authorization", `Bearer ${ds_token}`)
    .set("Content-Type", "application/json")
    .send({ imageIds: [imageId] });

});

  // ================= NOT HAPPY PATH =================
  it("rejects unauthenticated annotation creation", async () => {
    const res = await request(app)
      .post("/api/annotations")
      .send({
        imageId: "img_unauth",
        label: "dog",
      });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Access token required" });
  });

  it("fails with 400 on invalid annotation payload", async () => {
    // Missing required fields, malformed structure
    const invalidPayload = {
      imageId: 123,
      label: null,
    };

    const res = await request(app)
      .post("/api/annotations")
      .set("Authorization", `Bearer ${an_token}`)
      .send(invalidPayload);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body).toHaveProperty("details");
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
   
  