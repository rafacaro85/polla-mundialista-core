import {
  Controller,
  Patch,
  Body,
  Request,
  UseGuards,
  Get,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../database/entities/user.entity';

interface RequestWithUser extends Request {
  user: User;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Get()
  async getAllUsers() {
    console.log('📋 [GET /users] Listando todos los usuarios...');
    const users = await this.usersService.findAll();

    // Omitir passwords por seguridad
    const sanitizedUsers = users.map(({ password, ...user }) => user);

    console.log(`✅ [GET /users] ${sanitizedUsers.length} usuarios encontrados`);
    return sanitizedUsers;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @Request() req: RequestWithUser,
    @Body() body: { nickname?: string; fullName?: string; phoneNumber?: string; avatarUrl?: string },
  ) {
    const userId = req.user.id;
    return this.usersService.updateProfile(userId, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() body: Partial<User>,
  ) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.usersService.update(user, body);
  }
}
