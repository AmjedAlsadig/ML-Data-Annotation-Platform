import { db } from "./db";
import { users } from "./schema";
import { deleteUserByEmail } from "./users";

export async function purgeTestUsers() {
    if (process.env.NODE_ENV !== "test") {
        throw new Error("Purge restricted to test environment");
    }

    const allUsers = await db.select().from(users);

    for (const u of allUsers) {
        if (typeof u.email === "string" && u.email.includes("_test_")) {
            await deleteUserByEmail(u.email);
        }
    }
}
