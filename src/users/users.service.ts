import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async fixBusinessUsers() {
    const users = await this.prisma.user.findMany({
      where: { currentUserType: 'business' },
      include: { ownedBusinesses: true },
    });

    let fixed = 0;
    for (const user of users) {
      if (!user.ownedBusinesses || user.ownedBusinesses.length === 0) {
        const businessName =
          user.displayName || user.firstName
            ? `${user.firstName} Negocio`
            : 'Mi Negocio';
        const newBusiness = await this.prisma.business.create({
          data: {
            ownerId: user.id,
            businessName: businessName,
            status: 'active',
            branches: {
              create: {
                name: 'Sede Principal',
                isMain: true,
                status: 'active',
                phone: user.phone,
              },
            },
          },
          include: { branches: true },
        });
        const mainBranch = newBusiness.branches[0];
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            currentBusinessId: newBusiness.id,
            currentBranchId: mainBranch.id,
          },
        });
        fixed++;
      }
    }
    return { success: true, fixed };
  }

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

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const { password, ...result } = user;
    return result;
  }

  async getPreferences(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user.preferences || {};
  }

  async updatePreferences(userId: string, newPreferences: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const currentPreferences = (user.preferences as object) || {};
    const mergedPreferences = {
      ...currentPreferences,
      ...newPreferences,
    };

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { preferences: mergedPreferences },
      select: { id: true, preferences: true },
    });

    return updatedUser.preferences;
  }

  async updateProfile(userId: string, data: any) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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
      include: { ownedBusinesses: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    let userTypesObj = { client: { status: 'active' } };
    if (user.userTypes) {
      userTypesObj =
        typeof user.userTypes === 'string'
          ? JSON.parse(user.userTypes)
          : user.userTypes;
    }

    const availableUserTypes = Object.keys(userTypesObj).filter(
      (key) => userTypesObj[key].status === 'active',
    );

    // Default to client if somehow missing
    if (!availableUserTypes.includes('client')) {
      availableUserTypes.push('client');
      userTypesObj['client'] = { status: 'active' };
    }

    const businessContexts = user.ownedBusinesses.map((b) => ({
      id: b.id,
      businessId: b.id,
      name: b.businessName,
      status: b.status,
    }));

    return {
      currentUserType: user.currentUserType || 'client',
      currentContext: {
        businessId: user.currentBusinessId,
        branchId: user.currentBranchId,
      },
      availableUserTypes,
      userTypes: userTypesObj,
      businessContexts,
    };
  }

  async remove(id: string) {
    try {
      return await this.prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new NotFoundException(
        `User with ID ${id} not found or could not be deleted`,
      );
    }
  }
}
