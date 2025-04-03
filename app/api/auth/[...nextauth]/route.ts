import NextAuth from "next-auth";
import { nextAuthOptions } from "@/config/nextAuthOptions";

const handler = NextAuth(nextAuthOptions);

export { handler as GET, handler as POST };
