import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const COMMENT_USER_SELECT = {
  id: true,
  displayName: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
};

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(postId: string, userId: string, content: string, parentId?: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    if (parentId) {
      const parent = await this.prisma.comment.findUnique({ where: { id: parentId } });
      if (!parent || parent.postId !== postId) {
        throw new NotFoundException(`Parent comment with ID ${parentId} not found in this post`);
      }
    }

    const comment = await this.prisma.comment.create({
      data: { postId, userId, content, parentId },
      include: { user: { select: COMMENT_USER_SELECT } },
    });

    await this.prisma.post.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } },
    });

    return comment;
  }

  async findByPost(postId: string, page = 1, limit = 20) {
    const comments = await this.prisma.comment.findMany({
      where: { postId, isActive: true },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: COMMENT_USER_SELECT } },
    });

    const nodesById = new Map<string, any>();
    comments.forEach((c) => nodesById.set(c.id, { ...c, replies: [] }));

    const roots: any[] = [];
    for (const comment of comments) {
      const node = nodesById.get(comment.id);
      const parent = comment.parentId ? nodesById.get(comment.parentId) : null;
      if (parent) {
        parent.replies.push(node);
      } else {
        roots.push(node);
      }
    }

    const total = roots.length;
    const start = (page - 1) * limit;
    const paginatedRoots = roots.slice(start, start + limit);

    return {
      data: paginatedRoots,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async remove(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment || !comment.isActive) {
      throw new NotFoundException(`Comment with ID ${commentId} not found`);
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('No puedes eliminar el comentario de otro usuario');
    }

    await this.prisma.comment.update({
      where: { id: commentId },
      data: { isActive: false },
    });

    const post = await this.prisma.post.findUnique({ where: { id: comment.postId } });
    const newCount = Math.max(0, (post?.commentCount || 1) - 1);
    await this.prisma.post.update({
      where: { id: comment.postId },
      data: { commentCount: newCount },
    });

    return { success: true, message: 'Comentario eliminado' };
  }
}
