
import { UserRole } from "../entities/User";
import { AuthService } from "../services/repo/auth/auth.service";

import bcrypt from "bcryptjs";

export const createSuperAdmin = async () => {
  try {
    const authService = new AuthService();
    const existingAdmin = await authService.findOneByCondition({
      role: UserRole.SUPER_ADMIN,
    });

    if (existingAdmin) {
      console.log("Admin is existed");
      return;
    }

    const email = process.env.SUPERADMIN_EMAIL || process.env.SUPERADMIN_PHONE;
    const password = process.env.SUPERADMIN_PASSWORD;
    
    if (!email) {
      throw new Error(
        "SUPERADMIN_EMAIL or SUPERADMIN_PHONE is not set in environment variables"
      );
    }

    if (!password) {
      throw new Error(
        "SUPERADMIN_PASSWORD is not set in environment variables"
      );
    }

    // Hash password with bcrypt (10 rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await authService.create({
      email,
      full_name: "Admin",
      gamer_name: "Admin",
      password_hash: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      is_active: true,
      phone:"0949620990",
      
    });
    
    console.log("Admin created successfully");
  } catch (error) {
    console.error("error when admin created:", error);
  }
};
