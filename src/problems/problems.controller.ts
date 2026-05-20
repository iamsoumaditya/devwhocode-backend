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
import { ProblemsService } from './problems.service';
import { ResponseMessage } from '../common/interceptors/response.interceptor';
import {
  AssignmentProblemResponseDto,
  CreateProblemDto,
  DeleteTestcasesDto,
  ProblemDetailsWithTestcasesDto,
  ProblemResponseDto,
  ProblemToAssignmentDto,
  ProblemToAssignmentResponseDto,
  ProblemWithDetailsResponseDto,
  ReorderProblemsDto,
  TestcaseDto,
  TestcaseResponseDto,
  UpdateProblemDto,
} from './dto';
import { AssistantGuard } from '../common/guards/assistant.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
@UseGuards(JwtAuthGuard)
@Controller('problems')
export class ProblemsController {
  constructor(private readonly problemsService: ProblemsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AssistantGuard)
  @ResponseMessage('Problem created successfully')
  registerProblem(
    @Body() dto: CreateProblemDto,
  ): Promise<ProblemWithDetailsResponseDto> {
    return this.problemsService.create(dto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(AssistantGuard)
  @ResponseMessage('Problem updated successfully')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProblemDto,
  ): Promise<ProblemDetailsWithTestcasesDto> {
    return this.problemsService.update(id, dto);
  }

  @Get()
  @UseGuards(AssistantGuard)
  @ResponseMessage('All Problems fetched successfully')
  findAll(): Promise<ProblemResponseDto[]> {
    return this.problemsService.findAll();
  }

  @Get(':id')
  @ResponseMessage('Problem details fetched successfully')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProblemDetailsWithTestcasesDto> {
    return this.problemsService.findOne(id);
  }

  @Patch('testcase/:testcaseId')
  @UseGuards(AssistantGuard)
  @ResponseMessage('Testcase updated successfully')
  @HttpCode(HttpStatus.OK)
  updateTestcase(
    @Param('testcaseId', ParseUUIDPipe) testcaseId: string,
    @Body() dto: TestcaseDto,
  ): Promise<TestcaseResponseDto> {
    return this.problemsService.updateTestcase(testcaseId, dto);
  }

  @Delete('testcases')
  @UseGuards(AssistantGuard)
  @ResponseMessage('Testcase deleted successfully')
  @HttpCode(HttpStatus.OK)
  removeTestcase(@Body() dto: DeleteTestcasesDto) {
    return this.problemsService.removeTestcases(dto.ids);
  }

  // dynamic route should be at the end of static routes
  @Delete(':id')
  @UseGuards(AssistantGuard)
  @ResponseMessage('Problem deleted successfully')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.problemsService.remove(id);
  }

  @Post('/assign/:assignmentId')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AssistantGuard)
  @ResponseMessage('Problem assigned to assignment successfully')
  assignAssignmentToLab(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @Body() dto: ProblemToAssignmentDto,
  ): Promise<ProblemToAssignmentResponseDto> {
    return this.problemsService.assignProblemToAssignment(assignmentId, dto);
  }

  @Post('/revoke/:assignmentId')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(AssistantGuard)
  @ResponseMessage('Problem revoked from Assignment successfully')
  revokeAssignmentToLab(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @Body() dto: ProblemToAssignmentDto,
  ): Promise<void> {
    return this.problemsService.revokeProblemFromAssignment(assignmentId, dto);
  }

  @Post('/reorder/:assignmentId')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(AssistantGuard)
  @ResponseMessage('Assignment reordered successfully')
  reorderProblemsInAssignment(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @Body() dto: ReorderProblemsDto,
  ): Promise<AssignmentProblemResponseDto[]> {
    return this.problemsService.reorderProblems(assignmentId, dto);
  }

  @Get('/:assignmentId/all')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('All assignment problems fetched successfully')
  findAllProblemsFromAssignment(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
  ): Promise<AssignmentProblemResponseDto[]> {
    return this.problemsService.findProblemsInAssignment(assignmentId);
  }
}
