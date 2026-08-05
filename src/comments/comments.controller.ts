import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CommentsService } from './comments.service';

@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('posts/:postId/comments')
  create(
    @Param('postId') postId: string,
    @Body('userId') userId: string,
    @Body('content') content: string,
    @Body('parentId') parentId?: string,
  ) {
    if (!userId) throw new BadRequestException('userId is required');
    if (!content || !content.trim()) {
      throw new BadRequestException('content is required');
    }
    return this.commentsService.create(postId, userId, content.trim(), parentId);
  }

  @Get('posts/:postId/comments')
  findByPost(
    @Param('postId') postId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.commentsService.findByPost(
      postId,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Delete('comments/:id')
  remove(@Param('id') id: string, @Body('userId') userId: string) {
    if (!userId) throw new BadRequestException('userId is required');
    return this.commentsService.remove(id, userId);
  }
}
