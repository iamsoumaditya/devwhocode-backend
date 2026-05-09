import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ProblemsService } from './problems.service';
import { ResponseMessage } from '../common/interceptors/response.interceptor';
import { CreateProblemDto, CreateProblemResponseDto } from './dto';

@Controller('problems')
export class ProblemsController {
  constructor(private readonly problemsService: ProblemsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('Problem created successfully')
  registerProblem(@Body() dto: CreateProblemDto): Promise<CreateProblemResponseDto> {
    return this.problemsService.create(dto);
  }
}
