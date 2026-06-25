import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { I18nService } from 'nestjs-i18n';
import { ROLES } from '../common/constants/roles';
import { RefreshToken } from './entities/refresh-token.entity';
import * as crypto from 'crypto';
import { Refresh_tokenDto } from './dto/refresh_token.dto';
import Redis from 'ioredis';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private jwtService: JwtService,
    private readonly i18n: I18nService,
    @Inject('REDIS_CLIENT')
    private redisClient: Redis,
  ) {}

  // ĐĂNG KÝ
  async register(registerDto: RegisterDto) {
    const { email, password, fullName } = registerDto;

    const isEmailExist = await this.userRepository.findOneBy({ email });
    if (isEmailExist)
      throw new BadRequestException(this.i18n.t('auth.email_in_use'));

    // Băm mật khẩu bằng Bcrypt trước khi lưu vào DB
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = this.userRepository.create({
      email,
      password: hashedPassword,
      fullName,
      role: ROLES.USER,
    });
    let savedUser;
    try {
      savedUser = await this.userRepository.save(newUser);
    } catch (error) {
      throw new InternalServerErrorException(
        this.i18n.t('auth.register_failed'),
      );
    }
    const userResponse = { ...savedUser };
    delete (userResponse as any).password;

    return userResponse;
  }

  // ĐĂNG NHẬP
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Ép TypeORM phải lấy ra cột password (vì mặc định cột này bị ẩn)
    const user = await this.userRepository
      .createQueryBuilder('users')
      .addSelect('users.password')
      .where('users.email = :email', { email })
      .getOne();

    if (!user)
      throw new UnauthorizedException(this.i18n.t('auth.invalid_credentials'));

    // So sánh mật khẩu client gửi lên với mật khẩu băm trong MySQL
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch)
      throw new UnauthorizedException(this.i18n.t('auth.invalid_credentials'));

    return {
      access_token: await this.generateAccessToken(user),
      refresh_token: await this.generateRefreshToken(user),
      user: { id: user.id, fullName: user.fullName, email: user.email },
    };
  }

  async generateRefreshToken(user: User) {
    const refreshTokenString = crypto.randomBytes(40).toString('hex');

    // Lưu Refresh Token xuống DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    try {
      const refreshTokenEntity = this.refreshTokenRepository.create({
        userId: user.id,
        token: refreshTokenString,
        expiresAt: expiresAt,
      });
      await this.refreshTokenRepository.save(refreshTokenEntity);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }


    return refreshTokenString;
  }

  async generateAccessToken(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.sign(payload, { expiresIn: '15m' });
  }

  async refreshAccessToken(refresh_tokenDto: Refresh_tokenDto) {
    const rfToken = refresh_tokenDto.refresh_token;
    // Tìm token trong DB
    const savedToken = await this.refreshTokenRepository.findOne({
      where: { token: rfToken },
      relations: {
        user: true,
      },
    });

    if (!savedToken) {
      throw new UnauthorizedException(
        this.i18n.t('auth.refresh_token_not_exist'),
      );
    }

    if (savedToken.isRevoked) {
      throw new UnauthorizedException(
        this.i18n.t('auth.refresh_token_revoked'),
      );
    }

    if (new Date() > savedToken.expiresAt) {
      throw new UnauthorizedException(
        this.i18n.t('auth.refresh_token_expired'),
      );
    }

    //Thu hồi token cũ, cấp access token và refresh token mới
    savedToken.isRevoked = true;
    try {
      await this.refreshTokenRepository.save(savedToken);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }

    return {
      access_token: await this.generateAccessToken(savedToken.user),
      refresh_token: await this.generateRefreshToken(savedToken.user),
    };
  }

  async logout(
    userId: number,
    accessToken: string,
    refresh_tokenDto: Refresh_tokenDto,
  ) {
    // Xóa refresh_token
    const rfToken = refresh_tokenDto.refresh_token;
    try {
      await this.refreshTokenRepository
        .createQueryBuilder()
        .update(RefreshToken)
        .set({ isRevoked: true })
        .where('userId = :userId', { userId: userId })
        .andWhere('token = :token', { token: rfToken })
        .execute();
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }


    const decoded: any = this.jwtService.decode(accessToken);
    if (decoded && decoded.exp) {
      // Tính toán số giây còn lại cho đến khi token hết hạn
      const currentTime = Math.floor(Date.now() / 1000);
      const expiresIn = decoded.exp - currentTime;

      if (expiresIn > 0) {
        // Lưu token vào black list
        await this.redisClient.set(
          `BL_${accessToken}`,
          'revoked',
          'EX',
          expiresIn,
        );
      }
    }

    return { message: this.i18n.t('auth.logout_success') };
  }
}