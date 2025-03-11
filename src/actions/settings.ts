"use server"

import bcrypt from "bcryptjs";
import * as z from "zod";
import { SettingsSchema } from "@/schemas";
import { getUserByEmail, getUserById } from "@/data/user";
import { db } from "@/lib/db";
import getAuthUser from "./get-auth-user";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";
import { getVerificationTokenByToken } from "@/data/verification-token";

/**
 * Updates user settings, including email, password, and two-factor authentication.
 * 
 * @param values - The user-provided settings data.
 * @returns Success or error message based on the update process.
 */
export const settings = async (values: z.infer<typeof SettingsSchema>) => {
  try {
    // Validate the provided input fields
    const validatedFields = SettingsSchema.safeParse(values);
    if (!validatedFields.success) return { error: "Invalid fields!" };

    // Get the authenticated user
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    // Prevent OAuth users from updating sensitive fields
    if (user.isOAuth) {
      validatedFields.data.email = undefined;
      validatedFields.data.password = undefined;
      validatedFields.data.newPassword = undefined;
      validatedFields.data.isTwoFactorEnabled = false;
    }

    /**
     * Handle email change: Send a verification token if email is different.
     */
    if (validatedFields.data.email && validatedFields.data.email !== user.email && !validatedFields.data.token) {
      const existingUser = await getUserByEmail(validatedFields.data.email);
      if (existingUser && existingUser.id !== user.id) {
        return { error: "Email already in use", email: "Email already in use" };
      }
      const verificationToken = await generateVerificationToken(validatedFields.data.email);
      await sendVerificationEmail(verificationToken.email, verificationToken.token);
      return { success: "Verification email sent", verificationToken: true };
    }

    /**
     * Validate the email verification token before updating the email.
     */
    if (validatedFields.data.email && validatedFields.data.email !== user.email && validatedFields.data.token) {
      const existingUser = await getUserByEmail(validatedFields.data.email);
      if (existingUser && existingUser.id !== user.id) {
        return { error: "Email already in use", email: "Email already in use" };
      }
      const verificationToken = await getVerificationTokenByToken(validatedFields.data.token);
      if (!verificationToken) {
        return { error: "Invalid token" };
      }
    }

    /**
     * Handle password update: Validate old password and hash the new one.
     */
    const dbUser = await getUserById(user.id);
    if (!dbUser) return { error: "User not found" };

    if (validatedFields.data.password && validatedFields.data.newPassword && dbUser.password) {
      const passwordMatch = await bcrypt.compare(validatedFields.data.password, dbUser.password);
      if (!passwordMatch) {
        return { error: "Incorrect password", password: "Incorrect password" };
      }
      const hashedPassword = await bcrypt.hash(validatedFields.data.newPassword, 10);
      validatedFields.data.password = hashedPassword;
      validatedFields.data.newPassword = undefined;
    } else {
      validatedFields.data.password = undefined;
      validatedFields.data.newPassword = undefined;
    }

    validatedFields.data.token = undefined;

    // Update user details in the database
    await db.user.update({
      where: { id: user.id },
      data: { ...validatedFields.data },
    });

    return { success: "User info updated!" };
  } catch (error) {
    console.error("Error updating user information", error);
    return { error: "Unauthorized" };
  }
};
