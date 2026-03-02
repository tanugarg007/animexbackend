import { Request, Response } from "express";
export declare const CreateUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const GetUsers: (req: Request, res: Response) => Promise<void>;
export declare const GetUserById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const UpdateUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const DeleteUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=index.d.ts.map