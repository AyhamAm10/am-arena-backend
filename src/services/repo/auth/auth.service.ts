import { Ensure } from "../../../common/errors/Ensure.handler";

import { User } from "../../../entities/User";
import { RepoService } from "../../repo.service";
import { JwtService } from "../../jwt/jwt.service";
import bcrypt from "bcryptjs";
import { getLanguage } from "../../../middlewares/lang.middleware";
import { ErrorMessages } from "../../../common/errors/ErrorMessages";
import { AuthRegisterDto } from "../../../dto/auth/auth-register.dto";
import { AuthLoginDto } from "../../../dto/auth/auth-login.dto";

type RegisterParams = Pick<AuthRegisterDto, "email" | "password" | "full_name" | "gamer_name" | "phone" | "profile_picture_url">;
type LoginParams = Pick<AuthLoginDto, "email" | "password">;

export class AuthService extends RepoService<User> {
  constructor() {
    super(User);

    // Bind methods to avoid losing context when used as callbacks
    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
  }

  async register(params: RegisterParams) {
    const { full_name , gamer_name , phone , profile_picture_url , email, password } = params;
    const currentLang = getLanguage();
    
    const existingUser = await this.findOneByCondition({ email });
    Ensure.alreadyExists(!!existingUser, "user");

    // Hash password with bcrypt (10 rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await this.create({ 
      email, 
      password_hash: hashedPassword,
      full_name , 
      gamer_name,
      phone,
      profile_picture_url
    });

    const tokens = JwtService.generateTokens({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    // Return user without password
    const { password_hash: _, ...userWithoutPassword } = newUser;

    return { user: userWithoutPassword, ...tokens };
  }

  async login(params: LoginParams) {
    const { email, password } = params;
    const currentLang = getLanguage();
    
    // Find user with password field included
    const user = await this.repo.findOne({ 
      where: { email },
      select: ['id', 'achievements', "password_hash", 'email', 'coins', 'role', 'full_name', 'gamer_name', 'is_active']
    });
    Ensure.exists(user, "user");

    // Verify password
    Ensure.exists(user?.password_hash, "password");

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error(ErrorMessages.generateErrorMessage("password", "invalid", currentLang));
    }

    const tokens = JwtService.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Return user without password
    const { password_hash: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, ...tokens };
  }
}
