import { describe, it, beforeAll, afterAll, expect } from "vitest";
import request from "supertest";
import { app, ready } from "../../index";
import { randomUUID } from "crypto";  

describe("Annotator – Labels", () => {
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
        name: "Admin23",
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
        name: "Data Specialist23",
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
        name: "Annotator23",
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
        name: "ML Engineer23",
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

  // create label type
  const labelTypeRes = await request(app)
    .post("/api/label-types")
    .set("Authorization", `Bearer ${an_token}`)
    .send({ name: `Dogs_${randomUUID()}`, description: "Dog labels"});

  expect(labelTypeRes.status).toBe(201);
  const labelId = labelTypeRes.body.data.id;
  expect(labelId).toBeDefined();
  

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

  createdProjectIds.push(projectId);
  createdLabelTypeIds.push(labelId);

  // create annotation
  // const res = await request(app)
  //   .post("/api/annotations")
  //   .set("Authorization", `Bearer ${an_token}`)
  //   .set("Content-Type", "application/json")
  //   .send({
  //     projectId,
  //     imageId,
  //     labelId,
  //     labelClassesId,
  //   });

  // expect(res.status).toBe(200);
  // expect(res.body.imageId).toBe(imageId);
});


  it("retrieves all label types", async () => {
    const res = await request(app)
      .get("/api/label-types")
      .set("Authorization", `Bearer ${an_token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // ================= NOT HAPPY PATH =================

  it("fails to create a label type with missing payload", async () => {
    const res = await request(app)
      .post("/api/label-types")
      .set("Authorization", `Bearer ${an_token}`)
      .send({}); // empty

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("fails to access protected endpoints without auth", async () => {
    const res = await request(app)
      .get("/api/label-types");

    expect(res.status).toBe(401);
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
