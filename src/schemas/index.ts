import * as z from "zod"

export const LoginSchema = z.object({
    email:z.string().email({
        message:"email is required"
    }),
    password:z.string({
        invalid_type_error:"must be a string"
    }).min(1,{
        message:"password is required"
    })
})