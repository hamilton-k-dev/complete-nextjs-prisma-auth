"use server"

import * as z from "zod"
import { LoginSchema } from "@/schemas"
import { signIn } from "@/auth"
import { DEFAULT_LOGIN_REDIRECT } from "@/route"
import { AuthError } from "next-auth"
import { getUserByEmail } from "@/data/user"
import { generateTwoFactorToken, generateVerificationToken } from "@/lib/tokens"
import { sendTwoFactorTokenEmail, sendVerificationEmail } from "@/lib/mail";
import { getTwoFactorTokenByEmail } from "@/data/two-factor-token"
import { db } from "@/lib/db"
import { getTwoFactorConfirmationByUserId } from "@/data/two-factor-confirmation"
/**
 * Logs in a user with the provided values.
 * 
 * @param values - The values to validate and use for login.
 * @returns An object containing an error message if the login fails, or a two-factor authentication prompt if required.
 * 
 * The function performs the following steps:
 * 1. Validates the input values against the `LoginSchema`.
 * 2. Checks if the user exists and if the password is set.
 * 3. Handles two-factor authentication if enabled for the user.
 * 4. Attempts to sign in the user with the provided credentials.
 * 
 * Possible return values:
 * - `{ error: "invalid fields !" }` if the input values are invalid.
 * - `{ error: "no password is set for your account click on forgot password ? to set one." }` if the user exists but no password is set.
 * - `{ error: "this email addresse does not exist" }` if the user does not exist.
 * - `{ error: "code invalide" }` if the two-factor authentication token is invalid.
 * - `{ error: "code expiré" }` if the two-factor authentication token has expired.
 * - `{ twoFactor: true }` if two-factor authentication is required and a token has been sent.
 * - `{ error: "Invalid credentials!" }` if the credentials are invalid.
 * - `{ error: "Something when wrong!" }` if an unknown error occurs.
 */
export const login = async (values: z.infer<typeof LoginSchema>) => {
  const validatedFields = LoginSchema.safeParse(values)
  if (!validatedFields.success) return { error: "invalid fields !" }
  const { email, password, token } = validatedFields.data
  const existingUser = await getUserByEmail(email);
  if (!!existingUser && !!existingUser.email && !existingUser.password) {
    return { error: "no password is set for your account click on forgot password ? to set one." };
  }
  if (!existingUser || !existingUser.email || !existingUser.password) {
    return { error: "this email addresse does not exist" };
  }
  if (existingUser.isTwoFactorEnabled && existingUser.email) {
    if (token) {
      const twoFactorToken = await getTwoFactorTokenByEmail(existingUser.email);
      if (!twoFactorToken) {
        return { error: "code invalide" };
      }
      if (twoFactorToken.token != token) {
        return { error: "code invalide" };
      }
      const hasExpired = new Date(twoFactorToken.expires) < new Date();
      console.log({ hasExpired });
      if (hasExpired) {
        return { error: "code expiré" };
      }
      await db.twoFactorToken.delete({
        where: {
          id: twoFactorToken.id,
        },
      });
      const existingConfirmation = await getTwoFactorConfirmationByUserId(
        existingUser.id
      );
      console.log({ existingConfirmation });
      if (existingConfirmation) {
        await db.twoFactorConfirmation.delete({
          where: { id: existingConfirmation.id },
        });
      }
      await db.twoFactorConfirmation.create({
        data: {
          userId: existingUser.id,
        },
      });
    } else {
      const twoFactorToken = await generateTwoFactorToken(existingUser.email);
      await sendTwoFactorTokenEmail(twoFactorToken.email, twoFactorToken.token);
      return { twoFactor: true };
    }
  }
  try {
    await signIn("credentials", { email, password, redirectTo: DEFAULT_LOGIN_REDIRECT })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials!" }

        default:
          return { error: "Something when wrong!" }
      }
    }
    throw error
  }
  return { error: "Something when wrong!" }
}