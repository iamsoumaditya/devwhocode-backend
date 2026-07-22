import {
  Controller,
  Post,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  Delete,
  Get,
  Query,
} from '@nestjs/common';
import { ExecuteService } from './execute.service';
import { RunCodeDto, SubmitCodeDto } from './dto/execute.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  LeaderboardDto,
  LeaderboardResponseDto,
  StatResultDto,
  StatsDto,
} from './dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class ExecuteController {
  constructor(private readonly executeService: ExecuteService) { }

  @Post('execute/run')
  @HttpCode(HttpStatus.OK)
  async run(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: RunCodeDto,
  ) {
    const result = await this.executeService.run(req.user.id, dto);
    return {
      success: true,
      data: result,
    };
  }

  @Post('execute/submit')
  @HttpCode(HttpStatus.OK)
  async submit(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: SubmitCodeDto,
  ) {
    const result = await this.executeService.submit(req.user.id, dto);
    return {
      success: true,
      data: result,
    };
  }

  @Delete('files/delete')
  @HttpCode(HttpStatus.OK)
  async clearFiles() {
    const result = await this.executeService.clearAllFiles();
    return {
      success: true,
      message: `${result.deleted} file(s) deleted`,
      data: result,
    };
  }

  @Get('leaderboard')
  @HttpCode(HttpStatus.OK)
  async leaderboard(
    @Query() dto: LeaderboardDto,
  ): Promise<LeaderboardResponseDto> {
    return await this.executeService.leaderboard(dto);
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  async stats(@Query() dto: StatsDto): Promise<StatResultDto> {
    return await this.executeService.stats(dto);
  }
}
