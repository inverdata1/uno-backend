import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get('profile')
  getProfile(@Req() req) {
    // Retornamos los datos del usuario logueado extraídos del token (agregado por JwtAuthGuard)
    return {
      id: req.user.sub,
      email: req.user.email,
      // Retornar datos extra mockeados hasta que se implemente consulta completa en BD
      firstName: 'Usuario',
      lastName: '',
    };
  }

  @Get('user-types')
  getUserTypes(@Req() req) {
    // Retornamos la estructura de roles que espera el frontend
    return {
      currentUserType: 'client',
      currentContext: { businessId: null, branchId: null },
      availableUserTypes: ['client'],
      userTypes: { client: { status: 'active' } },
      businessContexts: []
    };
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
