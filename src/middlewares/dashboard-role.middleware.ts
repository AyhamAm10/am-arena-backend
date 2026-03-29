import { AppDataSource } from "../config/data_source";
import { User, UserRole } from "../entities/User";

const DASHBOARD_ROLES: Record<string, UserRole> = {
  admin: UserRole.ADMIN,
  super_admin: UserRole.SUPER_ADMIN,
};

export async function resolveDashboardRoleUser(
  dashboardRoleHeader?: string,
): Promise<User | null> {
  if (!dashboardRoleHeader) {
    return null;
  }

  const normalizedRole = dashboardRoleHeader.trim().toLowerCase();
  const requestedRole = DASHBOARD_ROLES[normalizedRole];

  if (!requestedRole) {
    return null;
  }

  const userRepository = AppDataSource.getRepository(User);
  const exactMatch = await userRepository.findOne({
    where: { role: requestedRole },
    order: { id: "ASC" },
  });

  if (exactMatch) {
    return exactMatch;
  }

  if (requestedRole === UserRole.ADMIN) {
    return userRepository.findOne({
      where: { role: UserRole.SUPER_ADMIN },
      order: { id: "ASC" },
    });
  }

  return null;
}
