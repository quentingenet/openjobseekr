import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiProblem } from '../common/decorators/api-problem.decorator.js';
import { ErrorCode } from '../common/error-codes.js';
import {
  type AuthenticatedUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { AuthService } from './auth.service.js';
import { AuthResponseDto, UserResponseDto } from './dto/auth-response.dto.js';
import { LoginDto, RegisterDto } from './dto/credentials.dto.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Create an account and return an access token' })
  @ApiCreatedResponse({ type: AuthResponseDto })
  @ApiProblem(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_FAILED)
  @ApiProblem(HttpStatus.CONFLICT, ErrorCode.EMAIL_ALREADY_USED)
  register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.auth.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in and return an access token' })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiProblem(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_FAILED)
  @ApiProblem(HttpStatus.UNAUTHORIZED, ErrorCode.INVALID_CREDENTIALS)
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.auth.login(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Return the authenticated user' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiProblem(HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED)
  me(@CurrentUser() user: AuthenticatedUser): Promise<UserResponseDto> {
    return this.auth.getProfile(user.id);
  }
}
