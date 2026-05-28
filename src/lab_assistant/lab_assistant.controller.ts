import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { LabAssistantService } from './lab_assistant.service';
import { ResponseMessage } from '../common/interceptors/response.interceptor';
import { AssistantGuard } from '../common/guards/assistant.guard';
import { LabDto, LabResponseDto } from './dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { type RequestUser } from '../common/strategies/jwt.strategy';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
@Controller('lab')
@UseGuards(JwtAuthGuard)
export class LabAssistantController {
  constructor(private readonly labAssistantService: LabAssistantService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AssistantGuard)
  @ResponseMessage('Lab created successfully')
  createLab(
    @Body() dto: LabDto,
    @CurrentUser() user: RequestUser,
  ): Promise<LabResponseDto> {
    return this.labAssistantService.createLab(dto, user);
  }

  @Patch('/:labId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AssistantGuard)
  @ResponseMessage('Lab updated successfully')
  updateLab(
    @Param('labId', ParseIntPipe) labId: number,
    @Body() dto: LabDto,
    @CurrentUser() user: RequestUser,
  ): Promise<LabResponseDto> {
    return this.labAssistantService.updateLab(labId, dto, user);
  }

  @Delete('/:labId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AssistantGuard)
  @ResponseMessage('Lab deleted successfully')
  deleteLab(
    @Param('labId', ParseIntPipe) labId: number,
    @CurrentUser() user: RequestUser,
  ): Promise<void> {
    return this.labAssistantService.deleteLab(labId, user);
  }

  @Get('/all')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('All Labs fetched successfully')
  getAllLab(): Promise<LabResponseDto[]> {
    return this.labAssistantService.findAllLabs();
  }

  @Delete('assistant/:assistantId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AssistantGuard)
  @ResponseMessage('Lab Assistant deleted successfully')
  deleteAssistant(
    @Param('assistantId', ParseUUIDPipe) assistantId: string,
    @CurrentUser() user: RequestUser,
  ): Promise<void> {
    return this.labAssistantService.deleteAssistant(assistantId, user);
  }
}
