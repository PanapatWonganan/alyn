import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      penName: string | null;
      avatar: string | null;
      coinBalance: number;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    penName: string | null;
    coinBalance: number;
  }
}
