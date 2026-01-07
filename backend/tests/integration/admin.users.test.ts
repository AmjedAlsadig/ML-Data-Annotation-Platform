import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app, ready } from "../../index";

describe("Integration – Admin / Users", () => {
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
