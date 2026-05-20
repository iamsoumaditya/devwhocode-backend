import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ProblemsService } from './problems.service';
import { AssistantGuard } from '../common/guards/assistant.guard';
import { ResponseMessage } from '../common/interceptors/response.interceptor';
import {
  ActivateAssignmentDto,
  ActivateAssignmentResponseDto,
  AssignmentDto,
  AssignmentFromLabResponseDto,
  AssignmentResponseDto,
  AssignmentToLabDto,
  AssignmentToLabResponseDto,
} from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
@UseGuards(JwtAuthGuard)
@Controller('assignment')
export class AssignmentController {
  constructor(private readonly problemsService: ProblemsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AssistantGuard)
  @ResponseMessage('Assignment created successfully')
  registerAssignment(
    @Body() dto: AssignmentDto,
  ): Promise<AssignmentResponseDto> {
    return this.problemsService.createAssignment(dto);
  }

  @Patch('/:assignmentId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AssistantGuard)
  @ResponseMessage('Assignment updated successfully')
  updateAssignment(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @Body() dto: AssignmentDto,
  ): Promise<AssignmentResponseDto> {
    return this.problemsService.updateAssignment(assignmentId, dto);
  }

  @Delete('/:assignmentId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AssistantGuard)
  @ResponseMessage('Assignment deleted successfully')
  deleteAssignment(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
  ): Promise<void> {
    return this.problemsService.deleteAssignment(assignmentId);
  }

  @Post('/assign/:labId')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AssistantGuard)
  @ResponseMessage('Assignment assigned to lab successfully')
  assignAssignmentToLab(
    @Param('labId', ParseIntPipe) labId: number,
    @Body() dto: AssignmentToLabDto,
  ): Promise<AssignmentToLabResponseDto> {
    return this.problemsService.assignAssignmentToLab(labId, dto);
  }

  @Post('/revoke/:labId')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(AssistantGuard)
  @ResponseMessage('Assignment revoked from lab successfully')
  revokeAssignmentToLab(
    @Param('labId', ParseIntPipe) labId: number,
    @Body() dto: AssignmentToLabDto,
  ): Promise<void> {
    return this.problemsService.revokeAssignmentFromLab(labId, dto);
  }

  @Get('/all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AssistantGuard)
  @ResponseMessage('All assignments fetched successfully')
  findAllAssignment(): Promise<AssignmentResponseDto[]> {
    return this.problemsService.findAllAssignments();
  }

  @Get('/:labId')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('All assignments from a lab fetched successfully')
  findAllAssignmentsFromLab(
    @Param('labId', ParseIntPipe) labId: number,
  ): Promise<AssignmentFromLabResponseDto[]> {
    return this.problemsService.findAssignmentsOfLab(labId);
  }

  @Post('activate/:assignmentId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AssistantGuard)
  @ResponseMessage('Assignment activated fetched successfully')
  activateAssignmentsInALab(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @Body() dto: ActivateAssignmentDto,
  ): Promise<ActivateAssignmentResponseDto> {
    return this.problemsService.activateAssignment(assignmentId, dto);
  }
}
