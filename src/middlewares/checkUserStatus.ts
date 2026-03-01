// // src/middleware/checkUserStatus.ts
// import { Request, Response, NextFunction } from "express";
// import { UserStatusService } from "../services/repositories/user/user-status.service";
// import { ApiResponse } from "../common/responses/api.response";
// import { Language } from "../common/errors/Ensure.handler";
// import { UnauthorizedError } from "../common/errors/http.error";
// import { UserStatus } from "../entities/enum";
// import { APIError, HttpStatusCode } from "../common/errors/api.error";


// export const checkUserStatus = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const lang: Language = (req.headers["accept-language"] as Language) || "en";

//     const userId = req.currentUser;
//     if (!userId) throw new UnauthorizedError();

//     const statusService = new UserStatusService(lang);
//     let lastStatus = null;

//     try {
//       lastStatus = await statusService.getLastStatusForUser(Number(userId));
//     } catch {
//       return next();
//     }
//     if (lastStatus && lastStatus.status !== UserStatus.active) {
//       throw new APIError(HttpStatusCode.USER_BLOCKED, "User is blocked");
//     }

//     next();
//   } catch (error: any) {
//     next(error);
//   }
// };

