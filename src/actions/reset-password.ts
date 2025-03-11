"use server";

import bcrypt from "bcryptjs";
import * as z from "zod";
import { ResetPasswordSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";
import { db } from "@/lib/db";
import { generatePasswordResetToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/mail";
import { getPasswordResetTokenByToken } from "@/data/password-reset-token";

/**
 * Handles password reset process including email validation, token verification, and password update.
 *
 * @param values - User input containing email, optional reset token, and new password.
 * @returns An object with success messages or error messages.
 */
export const resetPassword = async (values: z.infer<typeof ResetPasswordSchema>) => {
    try {
        // Validate input fields
        const validatedFields = ResetPasswordSchema.safeParse(values);
        if (!validatedFields.success) return { error: "Invalid fields!" };

        const { email, password, token } = validatedFields.data;

        // Step 1: Ensure at least one input field is provided
        if (!email && !token && !password) return { error: "This email doesn't exist!" };

        // Step 2: Request a password reset token
        if (email && !token && !password) {
            const dbUser = await getUserByEmail(email);
            if (!dbUser) return { error: "No user found with this email address." };

            const resetToken = await generatePasswordResetToken(email);
            await sendPasswordResetEmail(resetToken.email, resetToken.token);

            return { success: "Password reset token sent! Check your email.", validEmail: true };
        }

        // Step 3: Validate the reset token
        if (email && token && !password) {
            const dbToken = await getPasswordResetTokenByToken(token);
            if (!dbToken) return { error: "Invalid token!" };

            return { success: "Enter your new password!", validEmail: true, validToken: true };
        }

        // Step 4: Reset the password
        if (email && token && password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            const dbUser = await getUserByEmail(email);
            if (!dbUser) return { error: "No user found with this email address." };

            await db.user.update({
                where: { email },
                data: { password: hashedPassword },
            });

            return { success: "Password reset successfully!", validEmail: true, validToken: true, passwordReset: true };
        }

        return { error: "Something went wrong!" };
    } catch (error) {
        console.error("Error during password reset:", error);
        return { error: "Something went wrong!" };
    }
};