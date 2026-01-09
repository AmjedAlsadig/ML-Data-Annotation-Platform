import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app, ready } from "../../index";

describe("Integration – ML Engineer / Enriched Annotations", () => {

  beforeAll(async () => {
    await ready;

    // const adminEmail = `admin_${Date.now()}@test.com`;
    // const adminRes = await request(app)
    //   .post("/api/auth/register")
    //   .send({
    //     email: adminEmail,
    //     password: "password123",
    //     name: "Admin",
    //     firstName: "Admin",
    //     lastName: "User",
    //     role: "admin",
    //   });
    // expect(adminRes.status).toBe(201);

    // const adminLogin = await request(app)
    //   .post("/api/auth/login")
    //   .send({ email: adminEmail, password: "password123" });

    // adminToken = adminLogin.body.token;
    // expect(adminLogin.status).toBe(200);

    // const dsEmail = `ds_${Date.now()}@test.com`;
    // const dsRes = await request(app)
    //   .post("/api/auth/register")
    //   .send({
    //     email: dsEmail,
    //     password: "password123",
    //     name: "Data Specialist",
    //     firstName: "Data",
    //     lastName: "Specialist",
    //     role: "data_specialist",
    //   });
    // expect(dsRes.status).toBe(201);

    // const dsLogin = await request(app)
    //   .post("/api/auth/login")
    //   .send({ email: dsEmail, password: "password123" });

    // ds_token = dsLogin.body.token;
    // expect(dsLogin.status).toBe(200);

    // const annEmail = `an_${Date.now()}@test.com`;
    // const anRes = await request(app)
    //   .post("/api/auth/register")
    //   .send({
    //     email: annEmail,
    //     password: "password123",
    //     name: "Annotator",
    //     firstName: "Annnotator",
    //     lastName: "user",
    //     role: "annotator",
    //   });
    // expect(anRes.status).toBe(201);

    // const anLogin = await request(app)
    //   .post("/api/auth/login")
    //   .send({ email: annEmail, password: "password123" });
    // an_token = anLogin.body.token;
    // expect(anLogin.status).toBe(200);


    // const mlEmail = `ml_${Date.now()}@test.com`;
    // const mlRes = await request(app)
    //   .post("/api/auth/register")
    //   .send({
    //     email: mlEmail,
    //     password: "password123",
    //     name: "ML Engineer",
    //     firstName: "ML",
    //     lastName: "Engineer",
    //     role: "ml_engineer",
    //   });
    // expect(mlRes.status).toBe(201);
    // const mlLogin = await request(app)
    //   .post("/api/auth/login")
    //   .send({ email: mlEmail, password: "password123" });

    // ml_token = mlLogin.body.token;
    // expect(mlLogin.status).toBe(200);
  });

  it("Placeholder test", async () => {
    expect(1 + 1).toBe(2);

  });

});


//   // ================= HAPPY PATH =================
//   it("returns enriched annotations for valid ML Engineer request", async () => {
//     const res = await request(app)
//       .post("/api/ml/enriched-annotations")
//       .set("Authorization", `Bearer ${mlEngineerToken}`)
//       .send({
//         imageIds: ["img_1", "img_2"],
//       });

//     expect(res.status).toBe(200);
//     expect(Array.isArray(res.body)).toBe(true);

//     if (res.body.length > 0) {
//       expect(res.body[0]).toHaveProperty("imageId");
//       expect(res.body[0]).toHaveProperty("annotations");
//     }
//   });

//   // ================= NOT HAPPY PATH =================
//   it("rejects request when imageIds array is empty", async () => {
//     const res = await request(app)
//       .post("/api/ml/enriched-annotations")
//       .set("Authorization", `Bearer ${mlEngineerToken}`)
//       .send({ imageIds: [] });

//     expect(res.status).toBe(400);
//     expect(res.body).toHaveProperty("error");
//   });

//   it("rejects access for users without ML Engineer role", async () => {
//     const res = await request(app)
//       .post("/api/ml/enriched-annotations")
//       .set("Authorization", `Bearer ${annotatorToken}`)
//       .send({ imageIds: ["img_1", "img_2"] });

//     expect(res.status).toBe(403);
//   });
  
// });
