"use server"

import bcrypt from "bcryptjs"

import * as z from "zod"
import { RegisterSchema } from "@/schemas"
import { getUserByEmail } from "@/data/user"
import { db } from "@/lib/db"
export const register = async (values:z.infer<typeof RegisterSchema>)=>{
    const validatedFields = RegisterSchema.safeParse(values)
    if(!validatedFields.success) return {error :"invalid fields !"}
    const {email,password,firstName,lastName} = validatedFields.data
    const hashedPassword = await bcrypt.hash(password, 10);
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
        return { error: "email already in use" };
      }
      await db.user.create({
        data: {
          firstName,
          lastName,
          email,
          password: hashedPassword,
        },
      });
      // TODo send verification code
    return {success :"User created !"}
}