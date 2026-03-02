import type { Role } from "../generated/prisma/enums";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: number;
      email?: string;
      role?: Role;
    };
  }
}

export {};
