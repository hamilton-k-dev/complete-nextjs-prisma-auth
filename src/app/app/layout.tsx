"use server";

import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";

export default async function Layout({
  admin,
  user,
}: {
  children: React.ReactNode;
  admin: React.ReactNode;
  user: React.ReactNode;
}) {
  const session = await auth();
  const role = session?.user?.role;
  return (
    <SessionProvider session={session}>
      <>{role === "ADMIN" ? admin : user}</>
    </SessionProvider>
  );
}
