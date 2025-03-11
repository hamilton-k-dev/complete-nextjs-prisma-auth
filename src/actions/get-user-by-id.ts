"use server";

import { db } from "@/lib/db";

/**
 * Fetches a user by their unique ID from the database.
 *
 * @param id - The unique identifier of the user.
 * @returns The user object if found, otherwise null.
 */
export const getUserById = async (id: string) => {
    try {
        const user = await db.user.findUnique({
            where: { id },
        });
        return user;
    } catch (error) {
        console.error("Error retrieving user by ID:", error);
        return null;
    }
};
