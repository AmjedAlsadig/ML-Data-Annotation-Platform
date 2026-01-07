import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app, ready } from "../../index";

describe("Integration – Projects", () => {
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
  
        if (ids.length > 0) {
          await request(app)
            .delete("/api/label-types")
            .set("Authorization", `Bearer ${ds_token}`)
            .send({ ids });
        }
      }, 30000);

});
