import { Request, Response } from "express";
export interface Course {
    title: string;
    description: string;
    heading?: string;
    duration?: string;
}
export declare const CreateCourse: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const GetCourses: (req: Request, res: Response) => Promise<void>;
export declare const GetCourseById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const UpdateCourse: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const DeleteCourse: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=index.d.ts.map