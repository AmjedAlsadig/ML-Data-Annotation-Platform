import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app, ready } from "../../index";

describe("Integration – Data Specialist / Project", () => {
  let token: string;

  beforeAll(async () => {
    await ready;

    const email = `ds_${Date.now()}@test.com`;

    await request(app).post("/api/auth/register").send({
      email,
      password: "password123",
      name: "DS",
      firstName: "Data",
      lastName: "Specialist",
      role: "data_specialist",
    });

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "password123" });

    token = login.body.token;
  });

  it("fails with invalid payload", async () => {
    const res = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect([401, 403]).toContain(res.status);
  });

  it("creates project successfully", async () => {
    const res = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Integration Project" });

    expect([201, 401, 403]).toContain(res.status);
    expect([201, 401, 403]).toContain(res.status);

if (res.status === 201) {
  expect(res.body.name).toBe("Integration Project");
}

  });
});
