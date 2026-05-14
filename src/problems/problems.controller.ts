import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ProblemsService } from './problems.service';
import { ResponseMessage } from '../common/interceptors/response.interceptor';
import {
  CreateProblemDto,
  ProblemDetailsWithTestcasesDto,
  ProblemWithDetailsResponseDto,
  UpdateProblemDto,
} from './dto';

@Controller('problems')
export class ProblemsController {
  constructor(private readonly problemsService: ProblemsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('Problem created successfully')
  registerProblem(
    @Body() dto: CreateProblemDto,
  ): Promise<ProblemWithDetailsResponseDto> {
    return this.problemsService.create(dto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.ACCEPTED)
  @ResponseMessage('Problem updated successfully')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProblemDto,
  ):Promise<ProblemDetailsWithTestcasesDto> {
    return this.problemsService.update(id, dto);
  }

  @Get()
  @ResponseMessage('All Problems fetched successfully')
  findAll() {
    return this.problemsService.findAll();
  }

  @Get(':id')
  @ResponseMessage('Problem details fetched successfully')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.problemsService.findOne(id);
  }

  @Delete(':id')
  @ResponseMessage('Problem deleted successfully')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.problemsService.remove(id);
  }


  //update question response fix ,testcases delete update
}
