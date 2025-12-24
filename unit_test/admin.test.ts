/// <reference types="vitest/globals" />

import { describe, test, expect, vi } from "vitest";

vi.mock("@shared/schema", () => ({
  users: {},
  projects: {},
  labels: {},
  labelClasses: {},
  images: {},
  annotations: {},
  projectAssignments: {},
  projectImages: {}
}));


// -------------------- Mock DB functionalities --------------------

// Build fake DB backend with required mock functionalities
const qb: any = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  returning: vi.fn(),
  orderBy: vi.fn(),
  execute: vi.fn()
};


vi.mock("../backend/db", () => ({
  db: {
    select: vi.fn(() => qb),
    insert: vi.fn(() => qb),
    update: vi.fn(() => qb),
    delete: vi.fn(() => qb),
  }
}));

import { DbStorage } from "../backend/storage";

// -------------------- Mock Data --------------------

const mockUsers = [
  { id: "u1", name: "alpha", firstname: "alpha", lastname: "alpha", email: "alpha@test.com", password: "hashedpwd", role: "annotator", createAt: new Date(), resetPasswordToken: null, resetPassworToken: null, resetPasswordExpires: null },
  { id: "u2", name: "beta", firstname: "beta", lastname: "beta", email: "beta@test.com", password: "hashedpwd1", role: "data_specialist",  createAt: new Date(), resetPasswordToken: null, resetPassworToken: null, resetPasswordExpires: null },
] as const;

const mockProjects = [
  { id: "p1", name: "Project 1", createdBy: "u1" },
  { id: "p2", name: "Project 2", createdBy: "u2" },
] as const;


/// ---- User (verification, retrieval) tests -----
describe("User Storage Methods", () => {

  // Reset mocks before each test
beforeEach(() => {
  qb.select = vi.fn(() => qb);
  qb.insert = vi.fn(() => qb);
  qb.update = vi.fn(() => qb);
  qb.delete = vi.fn(() => qb);
  qb.from   = vi.fn(() => qb);
  qb.where  = vi.fn(() => qb);
  qb.innerJoin = vi.fn(() => qb);
  qb.values = vi.fn(() => qb);
  qb.set    = vi.fn(() => qb);
  qb.orderBy = vi.fn(() => qb);
  qb.execute = vi.fn();
  qb.returning = vi.fn();
});


// admin ======== getAllUsers ========
  test("getAllUsers returns all users", async () => {
    qb.select.mockReturnThis();
    qb.from.mockImplementation(() =>
        Promise.resolve(mockUsers)
    );

    const storage = new DbStorage();
    const result = await storage.getAllUsers();

    expect(result.length).toBe(2);
  });



});
    // ======== createUser ========