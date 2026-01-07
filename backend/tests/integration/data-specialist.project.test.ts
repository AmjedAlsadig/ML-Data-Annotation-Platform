import request from "supertest";
import { app, ready } from "../../index";

describe("Integration – Data Specialist / Project", () => {
  let ds_token: string;

  beforeAll(async () => {
    await ready;

    const dsLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "ds_2@test.com", password: "password123" });

    ds_token = dsLogin.body.token;
    expect(dsLogin.status).toBe(200);
    
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