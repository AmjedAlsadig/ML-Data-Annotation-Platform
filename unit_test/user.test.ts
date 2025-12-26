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
  projectImages: {},
}));

// -------------------- DB mocks --------------------
vi.mock("../backend/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { DbStorage } from "../backend/storage";
import { db } from "../backend/db";

// -------------------- Test data --------------------
const mockUsers = [
  {
    id: "u1",
    name: "alpha",
    firstName: "Alpha",
    lastName: "Alpha",
    email: "alpha@test.com",
    password: "hashedpwd",
    role: "annotator",
    createdAt: new Date(),
    resetPasswordToken: null,
    resetPasswordExpires: null,
  },
  {
    id: "u2",
    name: "beta",
    firstName: "Beta",
    lastName: "Beta",
    email: "beta@test.com",
    password: "hashedpwd1",
    role: "data_specialist",
    createdAt: new Date(),
    resetPasswordToken: null,
    resetPasswordExpires: null,
  },
] as const;

beforeEach(() => {
  vi.clearAllMocks();
});

// ===================================================================
// ============================= getUser ===============================
// ===================================================================
describe("User – getUser", () => {
  test("returns user by id (happy path)", async () => {
    (db.select as any).mockReturnValueOnce({
      from: () => ({
        where: () => [mockUsers[0]],
      }),
    });

    const storage = new DbStorage();
    const result = await storage.getUser("u1");

    expect(result).toEqual(mockUsers[0]);
  });

  test("throws when user does not exist", async () => {
    (db.select as any).mockReturnValueOnce({
      from: () => ({
        where: () => [],
      }),
    });

    const storage = new DbStorage();

    await expect(storage.getUser("missing-id")).rejects.toThrow(
      "User not found"
    );
  });

  test("throws on invalid user id", async () => {
    const storage = new DbStorage();

    await expect(storage.getUser("" as any)).rejects.toThrow(
      "Invalid user id"
    );
  });

  test("throws when DB fails", async () => {
    (db.select as any).mockImplementationOnce(() => {
      throw new Error("db fail");
    });

    const storage = new DbStorage();

    await expect(storage.getUser("u1")).rejects.toThrow(
      "Failed to fetch user"
    );
  });
});

// ===================================================================
// ========================= getUserByEmail ============================
// ===================================================================
describe("User – getUserByEmail", () => {
  test("returns user by email (happy path)", async () => {
    (db.select as any).mockReturnValueOnce({
      from: () => ({
        where: () => [mockUsers[1]],
      }),
    });

    const storage = new DbStorage();
    const result = await storage.getUserByEmail("beta@test.com");

    expect(result).toEqual(mockUsers[1]);
  });

  test("throws when no user matches", async () => {
    (db.select as any).mockReturnValueOnce({
      from: () => ({
        where: () => [],
      }),
    });

    const storage = new DbStorage();
    await expect(
      storage.getUserByEmail("missing-user@mail.com")
    ).rejects.toThrow("User not found");
  });

  test("throws on invalid email", async () => {
    const storage = new DbStorage();

    await expect(
      storage.getUserByEmail("" as any)
    ).rejects.toThrow("Invalid email");
  });

  test("throws when DB fails", async () => {
    (db.select as any).mockImplementationOnce(() => {
      throw new Error("db fail");
    });

    const storage = new DbStorage();

    await expect(
      storage.getUserByEmail("alpha@test.com")
    ).rejects.toThrow("Failed to fetch user by email");
  });
});

// ===================================================================
// ============================ createUser =============================
// ===================================================================
describe("User – createUser", () => {
  test("inserts a new user (happy path)", async () => {
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
      resetPasswordExpires: null,
    };

    (db.insert as any).mockReturnValueOnce({
      values: () => ({
        returning: () => [newUser],
      }),
    });

    const storage = new DbStorage();
    const result = await storage.createUser(newUser as any);

    expect(result).toEqual(newUser);
  });

  test("throws when missing required fields", async () => {
    const incompleteUser = {
      name: "incomplete",
      email: "",
      password: "pwd",
    };

    const storage = new DbStorage();
    await expect(storage.createUser(incompleteUser as any)).rejects.toThrow(
      "Invalid user data"
    );
  });

  test("throws when DB insert fails", async () => {
    (db.insert as any).mockImplementationOnce(() => {
      throw new Error("db fail");
    });

    const storage = new DbStorage();

    await expect(
      storage.createUser({
        name: "x",
        firstName: "X",
        lastName: "Y",
        email: "x@test.com",
        password: "pwd",
        role: "annotator",
      } as any)
    ).rejects.toThrow("Failed to create user");
  });

  test("throws when DB insert returns no user", async () => {
    (db.insert as any).mockReturnValueOnce({
      values: () => ({
        returning: () => [],
      }),
    });

    const storage = new DbStorage();

    await expect(
      storage.createUser({
        name: "x",
        firstName: "X",
        lastName: "Y",
        email: "x@test.com",
        password: "pwd",
        role: "annotator",
      } as any)
    ).rejects.toThrow("User creation failed");
  });
});

// ===================================================================
// ============================ getAllUsers ============================
// ===================================================================
describe("User – getAllUsers", () => {
  test("returns all users (happy path)", async () => {
    (db.select as any).mockReturnValueOnce({
      from: () => mockUsers,
    });

    const storage = new DbStorage();
    const result = await storage.getAllUsers();

    expect(result.length).toBe(2);
    expect(result[0].id).toBe("u1");
  });

  test("returns empty array when no users", async () => {
    (db.select as any).mockReturnValueOnce({
      from: () => [],
    });

    const storage = new DbStorage();
    const result = await storage.getAllUsers();

    expect(result).toEqual([]);
  });

  test("throws when DB fails", async () => {
    (db.select as any).mockImplementationOnce(() => {
      throw new Error("db fail");
    });

    const storage = new DbStorage();

    await expect(storage.getAllUsers()).rejects.toThrow(
      "Failed to fetch users"
    );
  });
});

// ===================================================================
// =========================== updateUserRole ==========================
// ===================================================================
describe("User – updateUserRole", () => {
  test("updates user role (happy path)", async () => {
    (db.update as any).mockReturnValueOnce({
      set: () => ({
        where: () => ({
          execute: vi.fn().mockResolvedValue({ rowCount: 1 }),
        }),
      }),
    });

    const storage = new DbStorage();
    await expect(
      storage.updateUserRole("u1", "admin")
    ).resolves.toBeUndefined();
  });

  test("throws on invalid user id", async () => {
    const storage = new DbStorage();
    await expect(
      storage.updateUserRole("" as any, "admin")
    ).rejects.toThrow("Invalid user id");
  });

  test("throws when DB update fails", async () => {
    (db.update as any).mockImplementationOnce(() => {
      throw new Error("db fail");
    });

    const storage = new DbStorage();
    await expect(
      storage.updateUserRole("u1", "admin")
    ).rejects.toThrow("Failed to update user role");
  });

  test("throws when user not found", async () => {
    (db.update as any).mockReturnValueOnce({
      set: () => ({
        where: () => ({
          execute: vi.fn().mockResolvedValue({ rowCount: 0 }),
        }),
      }),
    });

    const storage = new DbStorage();
    await expect(
      storage.updateUserRole("u1", "admin")
    ).rejects.toThrow("User not found");
  });
});

// ===================================================================
// ========================= password reset API ========================
// ===================================================================
describe("User – password reset flow", () => {
  test("saveResetToken updates token (happy path)", async () => {
    (db.update as any).mockReturnValueOnce({
      set: () => ({
        where: () => ({
          execute: vi.fn().mockResolvedValue({ rowCount: 1 }),
        }),
      }),
    });

    const storage = new DbStorage();
    await expect(
      storage.saveResetToken("u1", "token123", new Date())
    ).resolves.toBeUndefined();
  });

  test("saveResetToken throws when DB update fails", async () => {
    (db.update as any).mockImplementationOnce(() => {
      throw new Error("db fail");
    });

    const storage = new DbStorage();
    await expect(
      storage.saveResetToken("u1", "token123", new Date())
    ).rejects.toThrow("Failed to save reset token");
  });

  test("getUserByResetToken returns user (happy path)", async () => {
    (db.select as any).mockReturnValueOnce({
      from: () => ({
        where: () => [mockUsers[0]],
      }),
    });

    const storage = new DbStorage();
    const result = await storage.getUserByResetToken("token123");

    expect(result?.id).toBe("u1");
  });

  test("getUserByResetToken throws when token not found", async () => {
    (db.select as any).mockReturnValueOnce({
      from: () => ({
        where: () => [],
      }),
    });

    const storage = new DbStorage();
    await expect(
      storage.getUserByResetToken("missing-token")
    ).rejects.toThrow("Reset token not found or expired");
  });

  test("getUserByResetToken throws when DB fails", async () => {
    (db.select as any).mockImplementationOnce(() => {
      throw new Error("db fail");
    });

    const storage = new DbStorage();
    await expect(
      storage.getUserByResetToken("token123")
    ).rejects.toThrow("Failed to fetch user by reset token");
  });

  test("updateUserPassword updates password (happy path)", async () => {
    (db.update as any).mockReturnValueOnce({
      set: () => ({
        where: () => ({
          execute: vi.fn().mockResolvedValue({ rowCount: 1 }),
        }),
      }),
    });

    const storage = new DbStorage();
    await expect(
      storage.updateUserPassword("u1", "newHash")
    ).resolves.toBeUndefined();
  });

  test("updateUserPassword throws when DB update fails", async () => {
    (db.update as any).mockImplementationOnce(() => {
      throw new Error("db fail");
    });

    const storage = new DbStorage();
    await expect(
      storage.updateUserPassword("u1", "newHash")
    ).rejects.toThrow("Failed to update user password");
  });
});
