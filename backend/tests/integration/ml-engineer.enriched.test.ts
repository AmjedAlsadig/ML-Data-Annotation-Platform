import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app, ready } from "../../index";

describe("Integration – ML Engineer", () => {
  let token: string;

  beforeAll(async () => {
    await ready;

    const email = `ml_${Date.now()}@test.com`;

    await request(app).post("/api/auth/register").send({
      email,
      password: "password123",
      name: "ML",
      firstName: "ML",
      lastName: "Engineer",
      role: "ml_engineer",
    });

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "password123" });

    token = login.body.token;
  });

  it("fails with empty imageIds", async () => {
    const res = await request(app)
      .post("/api/ml/enriched-annotations")
      .set("Authorization", `Bearer ${token}`)
      .send({ imageIds: [] });

    expect([400, 404]).toContain(res.status);
  });
});
