import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app, ready } from "../../index";

describe("Integration – Auth / Password Flows (No Shared Helpers)", () => {
  let email: string;

  beforeAll(async () => {
    await ready;
    email = `an_2@test.com`;
  });

  // ------------------------------------------------------------------
  // Forgot Password
  // ------------------------------------------------------------------
  
  // ================= HAPPY PATH =================
  
  it("returns generic success message when email exists", async () => {
    
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email : email });

    expect(res.status).toBe(200);
  });
  
  // ================= NOT HAPPY PATH =================

  it("returns the same generic success message when email does not exist", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "user@example.com" });

    expect(res.status).toBe(200);
  });

  it("rejects forgot-password when email is missing", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Email is required");
  });

  // ------------------------------------------------------------------
  // Reset Password
  // ------------------------------------------------------------------

  // ================= HAPPY PATH =================

  it("resets password successfully with a valid token", async () => {
  
    const forgotRes = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email });

    expect(forgotRes.status).toBe(200);

    const resetToken = forgotRes.body.token;  
    expect(resetToken).toBeDefined();

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({
        token: resetToken,
        newPassword: "password123",
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Password has been updated.");
  });

  // ================= NOT HAPPY PATH =================

  it("rejects reset-password when token or password is missing", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Token and new password are required");
  });

  it("rejects reset-password when password is too short", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({
        token: "validtoken",
        newPassword: "short",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe(
      "Password must be at least 8 characters long"
    );
  });


  // ------------------------------------------------------------------
  // Change Password
  // ------------------------------------------------------------------
  
  // ================= HAPPY PATH =================

  it("changes password successfully with valid credentials", async () => {
    const email = `an_2@test.com`;
    const password = "password123";

    // Login
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email, password });

    const token = loginRes.body.token;

    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: password,
        newPassword: "password123",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Password updated successfully");
  });

  // ================= NOT HAPPY PATH =================

  it("rejects change-password when unauthenticated", async () => {
    const res = await request(app)
      .post("/api/auth/change-password")
      .send({
        currentPassword: "OldPass123!",
        newPassword: "NewPass123!",
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Access token required");
  });

  it("rejects change-password when current password is incorrect", async () => {
    const email = `an_2@test.com`;
    const password = "password123";

    // Login
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email, password });

    const token = loginRes.body.token;

    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: "WrongPassword!",
        newPassword: "NewPass123!",
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Incorrect current password ");
  });

});
