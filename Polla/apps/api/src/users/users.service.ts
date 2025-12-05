import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { UserRole } from '../database/enums/user-role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) { }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async create(
    email: string,
    fullName: string,
    password?: string,
    googleId?: string,
    avatarUrl?: string,
    phoneNumber?: string,
  ): Promise<User> {
    const newUser = this.usersRepository.create({
      email,
      fullName,
      password,
      googleId,
      avatarUrl,
      phoneNumber,
      role: UserRole.PLAYER,
    });
    return this.usersRepository.save(newUser);
  }

  async update(user: User, updates: Partial<User>): Promise<User> {
    Object.assign(user, updates);
    return this.usersRepository.save(user);
  }

  async updateProfile(userId: string, updates: { nickname?: string; fullName?: string; phoneNumber?: string; avatarUrl?: string }): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updates.nickname) user.nickname = updates.nickname;
    if (updates.fullName) user.fullName = updates.fullName;
    if (updates.phoneNumber) user.phoneNumber = updates.phoneNumber;
    if (updates.avatarUrl) user.avatarUrl = updates.avatarUrl;

    try {
      return await this.usersRepository.save(user);
    } catch (error) {
      console.error('❌ [UsersService] Error updating profile:', error);
      throw error;
    }
  }
}
