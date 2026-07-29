import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(data: any) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    // Filter out password and businessData from the original payload
    const { password, businessData, ...rest } = data;

    // Create user (and optionally business) atomically using a transaction
    const user = await this.prisma.$transaction(async (tx) => {
      let createdUser = await tx.user.create({
        data: {
          ...rest,
          password: hashedPassword,
        },
      });

      if (businessData) {
        const business = await tx.business.create({
          data: {
            ...businessData,
            ownerId: createdUser.id,
          },
        });

        // Update the user's current business context
        createdUser = await tx.user.update({
          where: { id: createdUser.id },
          data: { currentBusinessId: business.id },
        });
      }

      return createdUser;
    });

    // Remove password from response
    const { password: _, ...result } = user;

    // Auto-login after register
    const payload = { sub: user.id, email: user.email };
    return {
      user: result,
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async login(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const isMatch = await bcrypt.compare(pass, user.password || '');
    if (!isMatch) {
      throw new UnauthorizedException('Contraseña incorrecta');
    }

    // Generate JWT
    const payload = { sub: user.id, email: user.email };

    // Return user without password + token
    const { password, ...result } = user;
    return {
      user: result,
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
