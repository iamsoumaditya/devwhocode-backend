import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ResponseMessage } from '../common/interceptors/response.interceptor';
import {
  RegisterStudentDto,
  AuthResponseDto,
  RegisterLabAssistantDto,
  LoginStudentDto,
  LoginLabAssistantDto,
  ResetPasswordDto,
  ForgetPasswordDto,
  DeleteStudentDto,
} from './dto/index';
import type { Request, Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/strategies/jwt.strategy';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AssistantGuard } from '../common/guards/assistant.guard';
import { StudentGuard } from '../common/guards/student.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('student/register')
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('Student registered successfully')
  registerStudent(
    @Body() dto: RegisterStudentDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    return this.authService.registerStudent(dto, res);
  }

  @Post('student/login')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Student Logged in successfully')
  loginStudent(
    @Body() dto: LoginStudentDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    return this.authService.loginStudent(dto, res);
  }

  @Post('student/resetPassword')
  @UseGuards(StudentGuard)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Password updated successfully')
  resetStudentPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<{ success: boolean }> {
    return this.authService.resetStudentPassword(dto);
  }

  @Post('student/forgetPassword')
  @UseGuards(AssistantGuard)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Password set successfully')
  forgetStudentPassword(
    @Body() dto: ForgetPasswordDto,
  ): Promise<{ success: boolean }> {
    return this.authService.forgetStudentPassword(dto);
  }

  @Post('assistant/register')
  @UseGuards(AssistantGuard)
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('Lab Assistant registered successfully')
  registerAssistant(
    @Body() dto: RegisterLabAssistantDto,
    @CurrentUser() user: RequestUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    return this.authService.registerAssistant(dto, user, res);
  }

  @Post('assistant/login')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Lab Assistant Logged in successfully')
  loginAssistant(
    @Body() dto: LoginLabAssistantDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    return this.authService.loginAssistant(dto, res);
  }

  @Post('assistant/resetPassword')
  @UseGuards(AssistantGuard)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Password updated successfully')
  resetAssistantPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<{ success: boolean }> {
    return this.authService.resetLabAssistantPassword(dto);
  }

  @Post('assistant/forgetPassword')
  @UseGuards(AssistantGuard)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Password set successfully')
  forgetAssistantPassword(
    @Body() dto: ForgetPasswordDto,
    @CurrentUser() user: RequestUser,
  ): Promise<{ success: boolean }> {
    return this.authService.forgetLabAssistantPassword(dto, user);
  }

  @Get('refresh')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Token refreshed successfully')
  refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      return this.authService.refresh('', res);
    }
    return this.authService.refresh(refreshToken, res);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Logged out successfully')
  logout(@Res({ passthrough: true }) res: Response) {
    this.authService.logout(res);
    return null;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: RequestUser) {
    return this.authService.getUser(user);
  }

  @Delete('students')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AssistantGuard)
  @ResponseMessage('Students deleted successfully')
  deleteAssistant(@Body() dto: DeleteStudentDto): Promise<{ deleted: number }> {
    return this.authService.deleteStudent(dto);
  }
}
