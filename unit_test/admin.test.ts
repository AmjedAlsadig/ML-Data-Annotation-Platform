/// <reference types="vitest/globals" />

import { describe, test, expect, vi, beforeEach } from "vitest";

// -------------------- Schema mocks --------------------

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

// -------------------- DB + QueryBuilder mocks --------------------

let qb: any;

vi.mock("../backend/db", () => ({
  db: {
    select: vi.fn(() => qb),
    insert: vi.fn(() => qb),
    update: vi.fn(() => qb),
    delete: vi.fn(() => qb),
  }
}));

import { DbStorage } from "../backend/storage";

// -------------------- Test Data --------------------

const mockUsers = [
  { id: "u1", name: "alpha", firstname: "alpha", lastname: "alpha", email: "alpha@test.com", password: "hashedpwd", role: "annotator", createAt: new Date(), resetPasswordToken: null, resetPassworToken: null, resetPasswordExpires: null },
  { id: "u2", name: "beta", firstname: "beta", lastname: "beta", email: "beta@test.com", password: "hashedpwd1", role: "data_specialist",  createAt: new Date(), resetPasswordToken: null, resetPassworToken: null, resetPasswordExpires: null },
] as const;

// -------------------- Fresh QB per test --------------------

beforeEach(() => {
  qb = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    values: vi.fn(),
    set: vi.fn(),
    returning: vi.fn(),
    orderBy: vi.fn(),
    execute: vi.fn(),
  };

  qb.select.mockReturnValue(qb);
  qb.insert.mockReturnValue(qb);
  qb.update.mockReturnValue(qb);
  qb.delete.mockReturnValue(qb);
  qb.from.mockReturnValue(qb);
  qb.where.mockReturnValue(qb);
  qb.values.mockReturnValue(qb);
  qb.set.mockReturnValue(qb);
  qb.orderBy.mockReturnValue(qb);
});


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


 // updateUserRole 
  test("updateUserRole updates a user's role", async () => {
    qb.update.mockReturnThis();
    qb.set = vi.fn().mockReturnThis();
    qb.where.mockReturnThis();
    qb.execute = vi.fn().mockResolvedValue([]);

    const storage = new DbStorage();
    await storage.updateUserRole("u1", "admin");

    expect(qb.set).toHaveBeenCalledWith({ role: "admin" });
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