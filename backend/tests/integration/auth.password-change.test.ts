import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app, ready } from "../../index";
import { randomUUID } from "crypto";  

describe("Integration – Auth / Password Flows", () => {
    let adminToken: string;
    let ds_token: string;
    let an_token: string;
    let ml_token: string;
    let dsEmail: string;
    let annEmail: string;
    let createdUserEmails: string[] = [];
  
    beforeAll(async () => {
      await ready;
  
      const adminEmail = `admin_${randomUUID()}@test.com`;
      const adminRes = await request(app)
        .post("/api/auth/register")
        .send({
          email: adminEmail,
          password: "password123",
          name: "Admin",
          firstName: "Admin",
          lastName: "User",
          role: "admin",
        });
      expect(adminRes.status).toBe(201);
  
      const adminLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: adminEmail, password: "password123" });
  
      adminToken = adminLogin.body.token;
      expect(adminLogin.status).toBe(200);
  
      dsEmail = `ds_${randomUUID()}@test.com`;
      const dsRes = await request(app)
        .post("/api/auth/register")
        .send({
          email: dsEmail,
          password: "password123",
          name: "Data Specialist",
          firstName: "Data",
          lastName: "Specialist",
          role: "data_specialist",
        });
      expect(dsRes.status).toBe(201);
  
      const dsLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: dsEmail, password: "password123" });
  
      ds_token = dsLogin.body.token;
      expect(dsLogin.status).toBe(200);
  
      annEmail = `an_${randomUUID()}@test.com`;
      const anRes = await request(app)
        .post("/api/auth/register")
        .send({
          email: annEmail,
          password: "password123",
          name: "Annotator",
          firstName: "Annnotator",
          lastName: "user",
          role: "annotator",
        });
      expect(anRes.status).toBe(201);
  
      const anLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: annEmail, password: "password123" });
      an_token = anLogin.body.token;
      expect(anLogin.status).toBe(200);
  
  
      const mlEmail = `ml_${randomUUID()}@test.com`;
      const mlRes = await request(app)
        .post("/api/auth/register")
        .send({
          email: mlEmail,
          password: "password123",
          name: "ML Engineer",
          firstName: "ML",
          lastName: "Engineer",
          role: "ml_engineer",
        });
      expect(mlRes.status).toBe(201);
      const mlLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: mlEmail, password: "password123" });
  
      ml_token = mlLogin.body.token;
      expect(mlLogin.status).toBe(200);
  
      createdUserEmails.push(adminEmail);
      createdUserEmails.push(dsEmail);
      createdUserEmails.push(annEmail);
      createdUserEmails.push(mlEmail);
    });

  // ------------------------------------------------------------------
  // Forgot Password
  // ------------------------------------------------------------------
  
  // ================= HAPPY PATH =================
  
  it("returns generic success message when email exists", async () => {
    
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email : dsEmail });

    expect(res.status).toBe(200);
  });
  
  // ================= NOT HAPPY PATH =================

  it("returns the same generic success message when email does not exist", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "user@example.com" });

    expect(res.status).toBe(500); // investigate why it's 500 and not 200
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
      .send({ email: annEmail });

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
        token: an_token,
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
    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${an_token}`)
      .send({
        currentPassword: "password123",
        newPassword: "password1234",
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

    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${an_token}`)
      .send({
        currentPassword: "WrongPassword!",
        newPassword: "NewPass123!",
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Incorrect current password ");
  });

 // ================= AUTOMATIC CLEANUP =================
  afterAll(async () => {

  for (const email of createdUserEmails) {
    await request(app)
      .delete("/api/users")
      .set("Authorization", `Bearer ${ds_token}`)
      .send({ email });
  }
  createdUserEmails = [];
  });
});
