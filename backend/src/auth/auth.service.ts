import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ObjectId } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../common/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(
    registerDto: RegisterDto,
  ): Promise<{ user: UserResponseDto; token: string }> {
    const {
      email,
      password: userPassword,
      firstName,
      lastName,
      phone,
    } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(userPassword, saltRounds);

    // Create user
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      role: 'user',
      isActive: true,
    });

    const savedUser = await this.userRepository.save(user);

    // Generate JWT token
    const token = this.jwtService.sign({
      sub: savedUser.id.toString(),
      email: savedUser.email,
      role: savedUser.role,
    });

    // Remove password from response and convert ObjectId to string
    const { password: _, ...userWithoutPassword } = savedUser;
    const userResponse = {
      ...userWithoutPassword,
      id: userWithoutPassword.id.toString(),
    };

    return { user: userResponse, token };
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ user: UserResponseDto; token: string }> {
    const { email, password: loginPassword } = loginDto;

    // Find user
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Generate JWT token
    const token = this.jwtService.sign({
      sub: user.id.toString(),
      email: user.email,
      role: user.role,
    });

    // Remove password from response and convert ObjectId to string
    const { password: _, ...userWithoutPassword } = user;
    const userResponse = {
      ...userWithoutPassword,
      id: userWithoutPassword.id.toString(),
    };

    return { user: userResponse, token };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async validateUserById(id: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: new ObjectId(id) },
    });
    if (user) {
      const { password, ...result } = user;
      return {
        ...result,
        id: result.id.toString(),
      };
    }
    return null;
  }
}
