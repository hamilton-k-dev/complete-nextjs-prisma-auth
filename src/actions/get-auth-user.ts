"use server";

import { auth } from "@/auth";

/**
 * Retrieves the authenticated user from the session.
 * 
 * @returns The authenticated user object if available, otherwise null.
 */
const getAuthUser = async () => {
   try {
      const session = await auth();
      return session?.user || null;
   } catch (error) {
      console.error("Error retrieving authenticated user:", error);
      return null;
   }
};

export default getAuthUser;