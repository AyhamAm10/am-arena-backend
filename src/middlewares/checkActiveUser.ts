import { Request, Response, NextFunction } from "express";

import { User } from "../entities/User";
import { RepoService } from "../services/repo.service";
import { Ensure } from "../common/errors/Ensure.handler";

export async function checkActiveUser(req: Request, res: Response, next: NextFunction) {
  const userId = req.currentUser;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  Ensure.exists(userId, "user")

  const userRepo = new RepoService(User);
  const user = await userRepo.findOneByCondition({ id: userId });

  if (!user || !user.is_active) {
    return res.status(403).json({ message: "User account is inactive" });
  }

  next();
}