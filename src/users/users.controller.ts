import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UsersQueryDto, UsersQueryResponseDto } from './dto/query.dto';
import { AssistantGuard } from '../common/guards/assistant.guard';
import {
  StatsResponseDto,
  UserRunsDto,
  UserStatsDto,
  UserSubmitsDto,
  UserSubmitsResponseDto,
} from './dto';
import { UserRunsResponseDto } from './dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { type RequestUser } from '../common/strategies/jwt.strategy';
@Controller('user')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AssistantGuard)
  async getUsers(
    @Query() query: UsersQueryDto,
  ): Promise<UsersQueryResponseDto> {
    const { data, total } = await this.usersService.findAll(query);

    return {
      data,
      meta: {
        total,
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        totalPages: Math.ceil(total / (query.limit ?? 20)),
      },
    };
  }

  @Get('/runs')
  @HttpCode(HttpStatus.OK)
  async getUserRuns(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
    @Query() query: UserRunsDto,
  ): Promise<UserRunsResponseDto> {
    const { data, total } = await this.usersService.findAllRunsByUserId(
      id,
      user,
      query,
    );

    return {
      data,
      meta: {
        total,
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        totalPages: Math.ceil(total / (query.limit ?? 20)),
      },
    };
  }

  @Get(':id/submits')
  @HttpCode(HttpStatus.OK)
  async getUserSubmits(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
    @Query() query: UserSubmitsDto,
  ): Promise<UserSubmitsResponseDto> {
    const { data, total } = await this.usersService.findAllSubmitsByUserId(
      id,
      user,
      query,
    );

    return {
      data,
      meta: {
        total,
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        totalPages: Math.ceil(total / (query.limit ?? 20)),
      },
    };
  }

  @Get(':id/stats')
  @HttpCode(HttpStatus.OK)
  async getUserAssignmentStats(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
    @Query() query: UserStatsDto,
  ): Promise<StatsResponseDto> {
    return await this.usersService.getAssignmentStatsByUserId(id, user, query);
  }
}
