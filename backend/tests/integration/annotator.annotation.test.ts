import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../index";

describe("Integration – Annotator / Annotation", () => {
  it("fails without authentication", async () => {
    const res = await request(app)
      .post("/api/annotations")
      .send({});

   expect([401, 404]).toContain(res.status);

  });
});
