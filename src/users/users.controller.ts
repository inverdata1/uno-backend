import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Query,
  BadRequestException,
} from '@nestjs/common';
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
    return this.usersService.getProfile(req.user.sub);
  }

  @Put('profile')
  async updateProfile(@Query('userId') userId: string, @Body() body: any) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return this.usersService.updateProfile(userId, body);
  }

  @Get('user-types')
  getUserTypes(@Req() req) {
    return this.usersService.getUserTypes(req.user.sub);
  }

  @Get('fix-business-users')
  fixBusinessUsers() {
    return this.usersService.fixBusinessUsers();
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
    return this.usersService.remove(id);
  }
}
