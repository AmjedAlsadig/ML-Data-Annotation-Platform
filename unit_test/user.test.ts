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


describe("User Storage Methods", () => {

  // ========= getUser =========

  test("getUser returns a user by ID when user exists", async () => {
    
    qb.where.mockImplementation(() =>  
        Promise.resolve(mockUsers.filter(u => u.id === "u1"))
    );

    const storage = new DbStorage();
    const result = await storage.getUser("u1");

    expect(result).toEqual(mockUsers[0]);
  });

test("getUser throws when user does not exist", async () => {
  qb.where.mockResolvedValue([]);

  const storage = new DbStorage();

  await expect(storage.getUser("missing-id"))
    .rejects
    .toThrow("User not found");
});

test("getUser throws when invalid user id type", async () => {
  
  const storage = new DbStorage();

  await expect(storage.getUser("" as any))
    .rejects
    .toThrow("Invalid user id");

    expect(qb.where).not.toHaveBeenCalled();

});



  // ======== getUserByEmail ========


  test("getUserByEmail returns a user by email if the user exists", async () => {

    qb.where.mockImplementation(() =>
        Promise.resolve(mockUsers.filter(u => u.email === "beta@test.com"))
    )

    const storage = new DbStorage();
    const result = await storage.getUserByEmail("beta@test.com");

    expect(result).toEqual(mockUsers[1]);

  });


  test("getUserByEmail returns undefined when no match", async () => {
    qb.where.mockResolvedValue([]);
    const storage = new DbStorage();

    await expect(storage.getUserByEmail("missing-user@mail.com"))
    .rejects
    .toThrow("User not found");

  });


  test("getUserByEmail throws when user type is invalid", async () => {
    const storage = new DbStorage();

    await expect(storage.getUserByEmail("" as any))
    .rejects
    .toThrow("Invalid email");

    expect(qb.where).not.toHaveBeenCalled();

  });

  // ======== createUser ========


test("createUser inserts a new user", async () => {
  const newUser = {
    id: "u3",
    name: "newuser",
    firstName: "New",
    lastName: "User",
    email: "new@test.com",
    password: "hashedpwd",
    role: "annotator",
    createdAt: new Date(),
    resetPasswordToken: null,
    resetPasswordExpires: null
  };

  qb.values = vi.fn(() => qb);
  qb.returning = vi.fn().mockResolvedValue([newUser]);

  const storage = new DbStorage();
  const result = await storage.createUser(newUser as any);

  expect(result).toEqual(newUser);
});


  test("createUser throws when missing required fields", async () => {
    const incompleteUser = {
      name: "incomplete",
      email: "",
      password: "pwd"
    };
    const storage = new DbStorage();
    await expect(storage.createUser(incompleteUser as any))
      .rejects
      .toThrow("Invalid user data");
  });



});

