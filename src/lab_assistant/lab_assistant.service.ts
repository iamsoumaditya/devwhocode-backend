import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database/database-connection';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as labSchema from '../lab_assistant/schema';
import * as problemSchema from './schema';
import { LabDto, LabResponseDto } from './dto';
import { eq } from 'drizzle-orm';
import { plainToInstance } from 'class-transformer';
import { RequestUser } from '../common/strategies/jwt.strategy';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class LabAssistantService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof problemSchema>,
    private readonly authService: AuthService,
  ) {}

  async createLab(dto: LabDto, user: RequestUser): Promise<LabResponseDto> {
    const isValidAdmin = await this.authService.isAdmin(user);

    if (!isValidAdmin) {
      throw new ForbiddenException(
        'Only Admin Assistants are allowed to perform this action',
      );
    }
    const [lab] = await this.db
      .insert(labSchema.labs)
      .values({ name: dto.name })
      .returning();

    return lab;
  }

  async updateLab(
    labId: number,
    dto: LabDto,
    user: RequestUser,
  ): Promise<LabResponseDto> {
    const isValidAdmin = await this.authService.isAdmin(user);

    if (!isValidAdmin) {
      throw new ForbiddenException(
        'Only Admin Assistants are allowed to perform this action',
      );
    }
    const existing = await this.db.query.labs.findFirst({
      where: eq(labSchema.labs.id, labId),
    });

    if (!existing) throw new NotFoundException(`Lab &${labId} not found.`);

    const [updated] = await this.db
      .update(labSchema.labs)
      .set(dto)
      .where(eq(labSchema.labs.id, labId))
      .returning();

    return updated;
  }

  async deleteLab(labId: number, user: RequestUser): Promise<void> {
    const isValidAdmin = await this.authService.isAdmin(user);

    if (!isValidAdmin) {
      throw new ForbiddenException(
        'Only Admin Assistants are allowed to perform this action',
      );
    }
    const existing = await this.db.query.labs.findFirst({
      where: eq(labSchema.labs.id, labId),
    });

    if (!existing) throw new NotFoundException(`Lab ${labId} not found.`);

    await this.db.delete(labSchema.labs).where(eq(labSchema.labs.id, labId));
  }

  async deleteAssistant(assistantId: string, user: RequestUser): Promise<void> {
    const isValidAdmin = await this.authService.isAdmin(user);

    if (!isValidAdmin) {
      throw new ForbiddenException(
        'Only Admin Assistants are allowed to perform this action',
      );
    }
    const existing = await this.db.query.labAssistants.findFirst({
      where: eq(labSchema.labAssistants.id, assistantId),
    });

    if (!existing)
      throw new NotFoundException(`Lab Assitant ${assistantId} not found.`);

    await this.db
      .delete(labSchema.labAssistants)
      .where(eq(labSchema.labAssistants.id, assistantId));
  }

  async findAllLabs(): Promise<LabResponseDto[]> {
    const rows = await this.db.query.labs.findMany();
    return plainToInstance(LabResponseDto, rows, {
      excludeExtraneousValues: true,
    });
  }
}
