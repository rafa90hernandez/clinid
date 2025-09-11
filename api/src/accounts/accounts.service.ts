import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';

type LocalUser = { id: string; email: string };

@Injectable()
export class AccountsService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ id: string; email: string; createdAt: Date }> {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new BadRequestException('E-mail já cadastrado');

    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
    const user = await this.prisma.user.create({
      data: { email: dto.email, passwordHash },
      select: { id: true, email: true, createdAt: true },
    });
    return user;
  }

  async validateUser(email: string, password: string): Promise<LocalUser | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.isDeleted) return null;
    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) return null;
    return { id: user.id, email: user.email };
  }

  async issueAccessToken(user: LocalUser): Promise<{ access_token: string }> {
    const payload = { sub: user.id, email: user.email };
    const access_token = await this.jwt.signAsync(payload, { expiresIn: '15m' });
    return { access_token };
  }
}
