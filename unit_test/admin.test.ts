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

 // updateUserRole 
test("updateUserRole updates a user's role", async () => {
  qb.execute.mockResolvedValue({ rowCount: 1 });

  const storage = new DbStorage();
  await storage.updateUserRole("u1", "admin");

  expect(qb.set).toHaveBeenCalledWith({ role: "admin" });
});

test("updateUserRole throws when user type invalid", async () => {
  qb.execute.mockResolvedValue();
  const storage = new DbStorage();
    await expect (storage.updateUserRole("" as any, "admin")).rejects.toThrow("Invalid user id");

});

test("updateUserRole throws when db fails", async () => {
  qb.execute.mockRejectedValue(new Error("db error"));
  const storage = new DbStorage();
    await expect (storage.updateUserRole("u1", "admin")).rejects.toThrow("Failed to update user role");

});

test("updateUserRole throws when user does not exist", async () => {
  qb.execute.mockResolvedValue({ rowCount: 0 });

  const storage = new DbStorage();

  await expect(storage.updateUserRole("missing-id", "admin"))
    .rejects
    .toThrow("User not found");
});



// admin ======== getAllUsers ========
 test("getAllUsers returns all users", async () => {
  qb.from.mockResolvedValue(mockUsers);

  const storage = new DbStorage();
  const result = await storage.getAllUsers();

  expect(result).toEqual(mockUsers);
});


test("getAllUsers throws when DB fails", async () => {
  qb.from.mockRejectedValue(new Error("db down"));

  const storage = new DbStorage();

  await expect(storage.getAllUsers())
    .rejects
    .toThrow("Failed to fetch users");
});



});
    // ======== createUser ========