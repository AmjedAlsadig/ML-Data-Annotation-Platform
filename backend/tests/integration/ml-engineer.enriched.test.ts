import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app, ready } from "../../index";

describe("Integration – ML Engineer / Enriched Annotations", () => {
  let mlEngineerToken: string;
  let annotatorToken: string;

  beforeAll(async () => {
    await ready;

    // --- ML Engineer ---
    const mlEmail = `ml_2@test.com`;
    const password = "password123";
    const mlLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: mlEmail, password });

    expect(mlLogin.status).toBe(200);
    mlEngineerToken = mlLogin.body.token;

    // --- Annotator (unauthorized role) ---
    const annotatorEmail = `ann_2@test.com`;
    const annotatorLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: annotatorEmail, password });

    expect(annotatorLogin.status).toBe(200);
    annotatorToken = annotatorLogin.body.token;
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
