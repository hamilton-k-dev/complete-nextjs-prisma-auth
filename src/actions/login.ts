"use server";

import * as z from "zod";
import { LoginSchema } from "@/schemas";
import { signIn } from "@/auth";
import { DEFAULT_LOGIN_REDIRECT } from "@/route";
import { AuthError } from "next-auth";
import { getUserByEmail } from "@/data/user";
import { generateTwoFactorToken } from "@/lib/tokens";
import { sendTwoFactorTokenEmail } from "@/lib/mail";
import { getTwoFactorTokenByEmail } from "@/data/two-factor-token";
import { db } from "@/lib/db";
import { getTwoFactorConfirmationByUserId } from "@/data/two-factor-confirmation";

/**
 * Handles user login, including credentials authentication and two-factor authentication (2FA).
 *
 * @param values - User login input containing email, password, and optional 2FA token.
 * @returns An object containing either an error message or a 2FA request status.
 */
export const login = async (values: z.infer<typeof LoginSchema>) => {
  // Validate input fields
  const validatedFields = LoginSchema.safeParse(values);
  if (!validatedFields.success) return { error: "Invalid fields!" };

  const { email, password, token } = validatedFields.data;

  // Check if user exists
  const existingUser = await getUserByEmail(email);

  if (existingUser && existingUser.email && !existingUser.password) {
    return {
      error: "No password is set for your account. Click on 'Forgot Password?' to set one."
    };
  }

  if (!existingUser || !existingUser.email || !existingUser.password) {
    return { error: "This email address does not exist." };
  }

  // Handle Two-Factor Authentication (2FA)
  if (existingUser.isTwoFactorEnabled && existingUser.email) {
    if (token) {
      // Verify 2FA token
      const twoFactorToken = await getTwoFactorTokenByEmail(existingUser.email);
      if (!twoFactorToken || twoFactorToken.token !== token) {
        return { error: "Invalid code." };
      }

      const hasExpired = new Date(twoFactorToken.expires) < new Date();
      if (hasExpired) {
        return { error: "Code has expired." };
      }

      // Remove used 2FA token
      await db.twoFactorToken.delete({
        where: { id: twoFactorToken.id },
      });

      // Remove previous 2FA confirmation if exists
      const existingConfirmation = await getTwoFactorConfirmationByUserId(existingUser.id);
      if (existingConfirmation) {
        await db.twoFactorConfirmation.delete({
          where: { id: existingConfirmation.id },
        });
      }

      // Create new 2FA confirmation
      await db.twoFactorConfirmation.create({
        data: { userId: existingUser.id },
      });
    } else {
      // Generate and send a new 2FA token
      const twoFactorToken = await generateTwoFactorToken(existingUser.email);
      await sendTwoFactorTokenEmail(twoFactorToken.email, twoFactorToken.token);
      return { twoFactor: true };
    }
  }

  try {
    // Sign in with credentials
    await signIn("credentials", { email, password, redirectTo: DEFAULT_LOGIN_REDIRECT });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials!" };
        default:
          return { error: "Something went wrong!" };
      }
    }
    throw error;
  }

  return { error: "Something went wrong!" };
};