import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app, ready } from "../../index";

describe("Integration – Auth / Logout", () => {
  const agent = request.agent(app); 
  let token: string;

  beforeAll(async () => {
    await ready;

    const email = `an_2@test.com`;
    const password = "password123";

    // Register user
    await agent.post("/api/auth/register").send({
      email,
      password,
      name: "LogoutUser",
      firstName: "Logout",
      lastName: "User",
      role: "annotator",
    });

    // Login to establish session
    const loginRes = await agent
      .post("/api/auth/login")
      .send({ email, password });
    
    expect(loginRes.status).toBe(200);

  });

  // ================= HAPPY PATH =================
  it("logs out an authenticated user successfully", async () => {
    const res = await agent.post("/api/auth/logout");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: "Logged out successfully",
    });
  });

    it("allows logout to be called even when user is not authenticated", async () => {
    const res = await request(app).post("/api/auth/logout");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: "Logged out successfully",
    });
  });

  // ================= NOT HAPPY PATH =================
  it("invalidates the session after logout", async () => {
    const res = await agent.get("/api/auth/me"); 
    expect(res.status).toBe(401);
  });

});
