import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database/database-connection';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as userSchema from '../users/schema';
import * as labAssistantSchema from '../lab_assistant/schema';
import {
  AuthResponseDto,
  LoginLabAssistantDto,
  RegisterLabAssistantDto,
  RegisterStudentDto,
  LoginStudentDto,
  ForgetPasswordDto,
  ResetPasswordDto,
} from './dto';
import { eq, or } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { RequestUser } from '../common/strategies/jwt.strategy';

const SALT_ROUNDS = 12;
type ExpiresIn = number | StringValue;

type StringValue =
  | `${number}s`
  | `${number}m`
  | `${number}h`
  | `${number}d`
  | `${number}w`
  | `${number}y`;

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<
      typeof userSchema & typeof labAssistantSchema
    >,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private issueTokens(
    tokenPayload: { id: string; role: 'student' | 'lab_assistant' },
    user: {
      id: string;
      name: string;
      email: string;
      role: 'student' | 'lab_assistant';
    },
    res: Response,
  ): AuthResponseDto {
    const access_token = this.signAccessToken(
      tokenPayload.id,
      tokenPayload.role,
    );
    const refresh_token = this.signRefreshToken(
      tokenPayload.id,
      tokenPayload.role,
    );

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth/refresh',
    });

    return { access_token, user };
  }

  private signAccessToken(
    sub: string,
    role: 'student' | 'lab_assistant',
  ): string {
    return this.jwt.sign(
      { sub, role, type: 'access' },
      {
        secret: this.config.get<string>('JWT_SECRET_KEY'),
        expiresIn: (this.config.get<string>('JWT_EXPIRES_IN') ??
          '15m') as ExpiresIn,
      },
    );
  }

  private signRefreshToken(
    sub: string,
    role: 'student' | 'lab_assistant',
  ): string {
    return this.jwt.sign(
      { sub, role, type: 'refresh' },
      {
        secret: this.config.getOrThrow<string>('JWT_SECRET_KEY'),
        expiresIn: (this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ??
          '7d') as ExpiresIn,
      },
    );
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie('refresh_token', { path: '/api/v1/auth/refresh' });
  }

  private async isPasswordCorrect(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  private async isAdmin(user: RequestUser): Promise<boolean> {
    const [assistant] = await this.db
      .select({
        role: labAssistantSchema.labAssistants.role,
      })
      .from(labAssistantSchema.labAssistants)
      .where(eq(labAssistantSchema.labAssistants.id, user.id))
      .limit(1);

    if (!assistant) {
      return false
    } else if (assistant.role === 'admin') {
      return true;
    } else {
      return false
    }
  }
  async registerStudent(
    dto: RegisterStudentDto,
    res: Response,
  ): Promise<AuthResponseDto> {
    const [department] = await this.db
      .select({ id: userSchema.departments.id })
      .from(userSchema.departments)
      .where(eq(userSchema.departments.id, dto.departmentId))
      .limit(1);

    if (!department) {
      throw new NotFoundException(
        `Department with id "${dto.departmentId}" does not exist`,
      );
    }

    const existing = await this.db
      .select({ email: userSchema.users.email })
      .from(userSchema.users)
      .where(eq(userSchema.users.email, dto.email))
      .limit(1);

    if (existing.length > 0) {
      if (existing[0].email === dto.email) {
        throw new ConflictException('Email is already registered');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    let newUser: { id: string; name: string; email: string };
    try {
      [newUser] = await this.db
        .insert(userSchema.users)
        .values({
          name: dto.name,
          email: dto.email,
          password: passwordHash,
          roll: dto.roll,
          sem: dto.sem,
          section: dto.section,
          batch: dto.batch,
          departmentId: dto.departmentId,
        })
        .returning({
          id: userSchema.users.id,
          name: userSchema.users.name,
          email: userSchema.users.email,
        });
    } catch {
      throw new InternalServerErrorException(
        'Failed to create user. Please try again.',
      );
    }

    return this.issueTokens(
      { id: newUser.id, role: 'student' },
      {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: 'student',
      },
      res,
    );
  }

  async loginStudent(
    dto: LoginStudentDto,
    res: Response,
  ): Promise<AuthResponseDto> {
    const [user] = await this.db
      .select({
        id: userSchema.users.id,
        name: userSchema.users.name,
        email: userSchema.users.email,
        password: userSchema.users.password,
      })
      .from(userSchema.users)
      .where(eq(userSchema.users.email, dto.email))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found!');
    }

    const isPasswordValid = await this.isPasswordCorrect(
      dto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid Credentials');
    }
    return this.issueTokens(
      { id: user.id, role: 'student' },
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'student',
      },
      res,
    );
  }

  async registerAssistant(
    dto: RegisterLabAssistantDto,
    user: RequestUser,
    res: Response,
  ): Promise<AuthResponseDto> {
    const isValidAdmin = await this.isAdmin(user);

    if (!isValidAdmin) {
      throw new ForbiddenException(
        'Only Admin Assistants are allowed to perform this action',
      );
    }

    const [lab] = await this.db
      .select({ id: labAssistantSchema.labs.id })
      .from(labAssistantSchema.labs)
      .where(eq(labAssistantSchema.labs.id, dto.labId))
      .limit(1);

    if (!lab) {
      throw new NotFoundException(`Lab ${dto.labId} does not exist`);
    }

    const [existingByLab] = await this.db
      .select({
        id: labAssistantSchema.labAssistants.id,
        labId: labAssistantSchema.labAssistants.labId,
        email: labAssistantSchema.labAssistants.email,
      })
      .from(labAssistantSchema.labAssistants)
      .where(
        or(
          eq(labAssistantSchema.labAssistants.labId, dto.labId),
          eq(labAssistantSchema.labAssistants.email, dto.email),
        ),
      )
      .limit(1);

    if (existingByLab) {
      if (existingByLab.labId === dto.labId) {
        throw new ConflictException(
          `Lab ${dto.labId} already has an assistant assigned`,
        );
      }
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    let newAssistant: { id: string; name: string; email: string };
    try {
      [newAssistant] = await this.db
        .insert(labAssistantSchema.labAssistants)
        .values({
          name: dto.name,
          email: dto.email,
          password: passwordHash,
          labId: dto.labId,
        })
        .returning({
          id: labAssistantSchema.labAssistants.id,
          name: labAssistantSchema.labAssistants.name,
          email: labAssistantSchema.labAssistants.email,
        });
    } catch {
      throw new InternalServerErrorException(
        'Failed to create assistant. Please try again.',
      );
    }

    return this.issueTokens(
      { id: newAssistant.id, role: 'lab_assistant' },
      {
        id: newAssistant.id,
        name: newAssistant.name,
        email: newAssistant.email,
        role: 'lab_assistant',
      },
      res,
    );
  }

  async loginAssistant(
    dto: LoginLabAssistantDto,
    res: Response,
  ): Promise<AuthResponseDto> {
    const [assistant] = await this.db
      .select({
        id: labAssistantSchema.labAssistants.id,
        name: labAssistantSchema.labAssistants.name,
        email: labAssistantSchema.labAssistants.email,
        password: labAssistantSchema.labAssistants.password,
      })
      .from(labAssistantSchema.labAssistants)
      .where(eq(labAssistantSchema.labAssistants.email, dto.email))
      .limit(1);

    if (!assistant) {
      throw new NotFoundException('Lab Assistant not found!');
    }

    const isPasswordValid = await this.isPasswordCorrect(
      dto.password,
      assistant.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid Credentials');
    }
    return this.issueTokens(
      { id: assistant.id, role: 'lab_assistant' },
      {
        id: assistant.id,
        name: assistant.name,
        email: assistant.email,
        role: 'lab_assistant',
      },
      res,
    );
  }

  async refresh(
    refreshToken: string,
    res: Response,
  ): Promise<{ access_token: string }> {
    let payload: { sub: string; role: string; type: string };
    try {
      payload = this.jwt.verify(refreshToken, {
        secret: this.config.get<string>('JWT_SECRET_KEY'),
      });
    } catch {
      this.clearRefreshCookie(res);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh') {
      this.clearRefreshCookie(res);
      throw new UnauthorizedException('Invalid token type');
    }

    const access_token = this.signAccessToken(
      payload.sub,
      payload.role as 'student' | 'lab_assistant',
    );

    return { access_token };
  }

  logout(res: Response): void {
    this.clearRefreshCookie(res);
  }

  async forgetStudentPassword(
    dto: ForgetPasswordDto,
  ): Promise<{ success: boolean }> {
    const [user] = await this.db
      .select({
        password: userSchema.users.password,
      })
      .from(userSchema.users)
      .where(eq(userSchema.users.id, dto.id))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found!');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    try {
      await this.db
        .update(userSchema.users)
        .set({ password: passwordHash })
        .where(eq(userSchema.users.id, dto.id));

      return { success: true };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to update password. Please try again.',
      );
    }
  }

  async forgetLabAssistantPassword(
    dto: ForgetPasswordDto,
    user: RequestUser,
  ): Promise<{ success: boolean }> {

    const isValidAdmin = await this.isAdmin(user);

    if (!isValidAdmin) {
      throw new ForbiddenException(
        'Only Admin Assistants are allowed to perform this action',
      );
    }

    const [assistant] = await this.db
      .select({
        password: labAssistantSchema.labAssistants.password,
      })
      .from(labAssistantSchema.labAssistants)
      .where(eq(labAssistantSchema.labAssistants.id, dto.id))
      .limit(1);

    if (!assistant) {
      throw new NotFoundException('Lab Assistant not found!');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    try {
      await this.db
        .update(labAssistantSchema.labAssistants)
        .set({ password: passwordHash })
        .where(eq(labAssistantSchema.labAssistants.id, dto.id));

      return { success: true };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to update password. Please try again.',
      );
    }
  }

  async resetLabAssistantPassword(
    dto: ResetPasswordDto,
  ): Promise<{ success: boolean }> {
    const [assistant] = await this.db
      .select({
        password: labAssistantSchema.labAssistants.password,
      })
      .from(labAssistantSchema.labAssistants)
      .where(eq(labAssistantSchema.labAssistants.id, dto.id))
      .limit(1);

    if (!assistant) {
      throw new NotFoundException('Lab Assistant not found!');
    }

    const isPasswordValid = await this.isPasswordCorrect(
      dto.password,
      assistant.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid Credentials');
    }
    const passwordHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);

    try {
      await this.db
        .update(labAssistantSchema.labAssistants)
        .set({ password: passwordHash })
        .where(eq(labAssistantSchema.labAssistants.id, dto.id));

      return { success: true };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to update password. Please try again.',
      );
    }
  }

  async resetStudentPassword(
    dto: ResetPasswordDto,
  ): Promise<{ success: boolean }> {
    const [user] = await this.db
      .select({
        password: userSchema.users.password,
      })
      .from(userSchema.users)
      .where(eq(userSchema.users.id, dto.id))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found!');
    }

    const isPasswordValid = await this.isPasswordCorrect(
      dto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid Credentials');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);

    try {
      await this.db
        .update(userSchema.users)
        .set({ password: passwordHash })
        .where(eq(userSchema.users.id, dto.id));

      return { success: true };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to update password. Please try again.',
      );
    }
  }

  async getUser(user: RequestUser) {
    let result;
    if (user.role === 'student') {
      result = await this.db
        .select({
          id: userSchema.users.id,
          name: userSchema.users.name,
          email: userSchema.users.email,
          roll: userSchema.users.roll,
          sem: userSchema.users.sem,
          section: userSchema.users.section,
          batch: userSchema.users.batch,
          department: {
            id: userSchema.departments.id,
            name: userSchema.departments.name,
          },
        })
        .from(userSchema.users)
        .innerJoin(
          userSchema.departments,
          eq(userSchema.users.departmentId, userSchema.departments.id),
        )
        .where(eq(userSchema.users.id, user.id))
        .limit(1);
    } else {
      result = await this.db
        .select({
          id: labAssistantSchema.labAssistants.id,
          name: labAssistantSchema.labAssistants.name,
          email: labAssistantSchema.labAssistants.email,
          lab: {
            id: labAssistantSchema.labs.id,
            name: labAssistantSchema.labs.name,
          },
        })
        .from(labAssistantSchema.labAssistants)
        .innerJoin(
          labAssistantSchema.labs,
          eq(
            labAssistantSchema.labAssistants.labId,
            labAssistantSchema.labs.id,
          ),
        )
        .where(eq(labAssistantSchema.labAssistants.id, user.id))
        .limit(1);
    }

    if (!result) {
      throw new NotFoundException('User not found');
    }

    return result;
  }
}
