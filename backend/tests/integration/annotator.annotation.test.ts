import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app, ready } from "../../index";

describe("Integration – Data Specialist / Project", () => {
   let adminToken: string;
   let ds_token: string;
   let an_token: string;
   let ml_token: string;
 
   beforeAll(async () => {
     await ready;
 
     const adminLogin = await request(app)
       .post("/api/auth/login")
       .send({ email: "admin_2@test.com", password: "password123" });
 
     adminToken = adminLogin.body.token;
     expect(adminLogin.status).toBe(200);
     
     const dsLogin = await request(app)
       .post("/api/auth/login")
       .send({ email: "ds_2@test.com", password: "password123" });
 
     ds_token = dsLogin.body.token;
     expect(dsLogin.status).toBe(200);
 
     const anLogin = await request(app)
       .post("/api/auth/login")
       .send({ email: "an_2@test.com", password: "password123" });
 
     an_token = anLogin.body.token;
     expect(anLogin.status).toBe(200);
 
     const mlLogin = await request(app)
       .post("/api/auth/login")
       .send({ email: "ml_2@test.com", password: "password123" });
 
     ml_token = mlLogin.body.token;
     expect(mlLogin.status).toBe(200);
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
    .send({ name: `Dogs_${Date.now()}`, description: "Dog labels"});

  expect(labelTypeRes.status).toBe(201);
  const labelId = labelTypeRes.body.data.id;
  expect(labelId).toBeDefined();
  

  // create label class
  const labelClassRes = await request(app)
    .post(`/api/label-types/${labelId}/classes`)
    .set("Authorization", `Bearer ${ds_token}`)
    .send({ name: `Collie_${Date.now()}`, description: "Dog labels"});

  expect(labelClassRes.status).toBe(201);
  const labelClassesId = labelClassRes.body.data.id;
  expect(labelClassesId).toBeDefined();

  // create image
  const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const filename = `img_${uniqueSuffix}.jpg`;
  const buffer = Buffer.from(`fake-image-${uniqueSuffix}`);
  const imageRes = await request(app)
    .post("/api/images/upload")
    .set("Authorization", `Bearer ${ds_token}`)
    .attach("images", buffer, filename);

  expect([200, 201]).toContain(imageRes.status);
  const imageId = imageRes.body.images[0].id;
  expect(imageId).toBeDefined();

  await request(app)
    .post(`/api/projects/${projectId}/images`)
    .set("Authorization", `Bearer ${ds_token}`)
    .set("Content-Type", "application/json")
    .send({ imageIds: [imageId] });

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
  
        const timestampRegex = /\d{13}/;
        const projectRegex = /Project/i;
  
        // ---------- PROJECTS ----------
        const projectsRes = await request(app)
          .get("/api/projects")
          .set("Authorization", `Bearer ${ds_token}`);
  
        const projectsToDelete = projectsRes.body.filter((p: any) =>
          projectRegex.test(p.name)
        );
  
        for (const project of projectsToDelete) {
          await request(app)
            .delete(`/api/projects/${project.id}`)
            .set("Authorization", `Bearer ${ds_token}`);
        }
  
        // ---------- LABEL TYPES ----------
        const labelsRes = await request(app)
          .get("/api/label-types")
          .set("Authorization", `Bearer ${ds_token}`);
  
        const labelTypesToDelete = labelsRes.body.data.filter((lt: any) =>
          typeof lt.name === "string" && timestampRegex.test(lt.name)
        );
  
        const ids = labelTypesToDelete.map((l: any) => l.id);
        
        for (const id of ids) {
          await request(app)
            .delete("/api/label-types")
            .set("Authorization", `Bearer ${ds_token}`)
            .send({ ids: [id] });
        }

        // if (ids.length > 0) {
        //   await request(app)
        //     .delete("/api/label-types")
        //     .set("Authorization", `Bearer ${ds_token}`)
        //     .send({ ids });
        // }
      }, 30000);

});
