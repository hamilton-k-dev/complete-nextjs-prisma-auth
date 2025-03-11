"use server";

import bcrypt from "bcryptjs";
import * as z from "zod";
import { RegisterSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";
import { getVerificationTokenByToken } from "@/data/verification-token";
import { db } from "@/lib/db";

/**
 * Handles user registration, including email verification and account creation.
 *
 * @param values - User input containing email, optional verification token, name, and password.
 * @returns An object containing success messages or error messages.
 */
export const register = async (values: z.infer<typeof RegisterSchema>) => {
  try {
    // Validate input fields
    const validatedFields = RegisterSchema.safeParse(values);
    if (!validatedFields.success) return { error: "Invalid fields!" };

    const { email, token, firstName, lastName, password } = validatedFields.data;

    // Check if the email is already registered
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return { error: "Email already in use." };
    }

    // Step 1: Send verification email if no token is provided
    if (email && !token) {
      const verificationToken = await generateVerificationToken(email);
      await sendVerificationEmail(verificationToken.email, verificationToken.token);
      return { success: "Token sent. Check your email!", emailSend: true };
    }

    // Step 2: Validate the token before registration
    if (email && token && !firstName && !password) {
      const dbToken = await getVerificationTokenByToken(token);
      if (!dbToken) return { error: "Invalid token!" };
      return { success: "Valid token!", emailSend: true, validToken: true };
    }

    // Step 3: Complete registration if token and user details are provided
    if (email && token && firstName && password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const dbToken = await getVerificationTokenByToken(token);
      if (!dbToken) return { error: "Invalid token!", validToken: false };

      // Create the new user in the database
      await db.user.create({
        data: {
          firstName,
          lastName,
          email: dbToken.email,
          password: hashedPassword,
        },
      });

      // Delete used verification token
      await db.verificationToken.deleteMany({
        where: { token },
      });

      return { success: "Account created!", emailSend: true, validToken: true, registrationCompleted: true };
    }

    return { error: "Something went wrong!" };
  } catch (error) {
    console.error("Error during registration:", error);
    return { error: "Something went wrong!" };
  }
};
