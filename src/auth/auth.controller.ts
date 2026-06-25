import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Refresh_tokenDto } from './dto/refresh_token.dto';
import { AuthGuard } from './guards/auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @ApiBearerAuth('JWT-auth')
  @Post('refresh-token')
  async refreshToken(@Body() refresh_tokenDto: Refresh_tokenDto) {
    return this.authService.refreshAccessToken(refresh_tokenDto);
  }

  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('user', 'admin')
  async logout(@Req() req, @Body() refresh_tokenDto: Refresh_tokenDto) {
    const accessToken = req.headers.authorization.split(' ')[1];
    return this.authService.logout(req.user.sub, accessToken, refresh_tokenDto);
  }
}