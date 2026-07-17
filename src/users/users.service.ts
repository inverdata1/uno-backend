import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  async updateProfile(userId: string, data: any) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Since the API receives specific fields, update them
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async getUserTypes(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { ownedBusinesses: true }
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    let userTypesObj = { client: { status: 'active' } };
    if (user.userTypes) {
      userTypesObj = typeof user.userTypes === 'string' ? JSON.parse(user.userTypes) : user.userTypes;
    }

    const availableUserTypes = Object.keys(userTypesObj).filter(key => userTypesObj[key].status === 'active');
    
    // Default to client if somehow missing
    if (!availableUserTypes.includes('client')) {
      availableUserTypes.push('client');
      userTypesObj['client'] = { status: 'active' };
    }

    const businessContexts = user.ownedBusinesses.map(b => ({
      id: b.id,
      name: b.businessName,
      status: b.status,
    }));

    return {
      currentUserType: user.currentUserType || 'client',
      currentContext: { 
        businessId: user.currentBusinessId, 
        branchId: user.currentBranchId 
      },
      availableUserTypes,
      userTypes: userTypesObj,
      businessContexts
    };
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
