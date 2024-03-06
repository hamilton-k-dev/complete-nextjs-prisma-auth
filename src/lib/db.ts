import { PrismaClient } from "@prisma/client";

declare global {
    var prisma : PrismaClient | undefined
}
// to not initializing a new prisma client when next js make a hot reload when we are not in production
export const db = globalThis.prisma || new PrismaClient()

if(process.env.NODE_ENV !== "production") globalThis.prisma = db