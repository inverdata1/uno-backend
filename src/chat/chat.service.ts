import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  /**
   * Find existing conversation between 2 participants or create a new one
   */
  async getOrCreateConversation(
    p1Id: string,
    p1Type: string,
    p2Id: string,
    p2Type: string,
  ) {
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        OR: [
          {
            participant1Id: p1Id,
            participant1Type: p1Type,
            participant2Id: p2Id,
            participant2Type: p2Type,
          },
          {
            participant1Id: p2Id,
            participant1Type: p2Type,
            participant2Id: p1Id,
            participant2Type: p1Type,
          },
        ],
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          participant1Id: p1Id,
          participant1Type: p1Type,
          participant2Id: p2Id,
          participant2Type: p2Type,
        },
        include: {
          messages: true,
        },
      });
    }

    // Enrich target participant profile (name, avatar/logo)
    const otherParticipant = await this.getParticipantInfo(
      conversation.participant1Id === p1Id && conversation.participant1Type === p1Type
        ? conversation.participant2Id
        : conversation.participant1Id,
      conversation.participant1Id === p1Id && conversation.participant1Type === p1Type
        ? conversation.participant2Type
        : conversation.participant1Type,
    );

    return {
      ...conversation,
      otherParticipant,
    };
  }

  /**
   * List active conversations for a participant (user or business)
   */
  async getConversationsForParticipant(participantId: string, participantType: string) {
    if (!participantId) return [];

    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [
          { participant1Id: participantId, participant1Type: participantType },
          { participant2Id: participantId, participant2Type: participantType },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    // Populate participant profiles & unread count
    const enriched = await Promise.all(
      conversations.map(async (conv) => {
        const isP1 = conv.participant1Id === participantId && conv.participant1Type === participantType;
        const otherId = isP1 ? conv.participant2Id : conv.participant1Id;
        const otherType = isP1 ? conv.participant2Type : conv.participant1Type;

        const otherParticipant = await this.getParticipantInfo(otherId, otherType);

        const unreadCount = await this.prisma.message.count({
          where: {
            conversationId: conv.id,
            receiverId: participantId,
            isRead: false,
          },
        });

        return {
          ...conv,
          otherParticipant,
          unreadCount,
        };
      }),
    );

    return enriched;
  }

  /**
   * Get messages in a conversation & mark incoming messages as read
   */
  async getMessages(conversationId: string, currentParticipantId: string) {
    if (currentParticipantId) {
      // Mark as read
      await this.prisma.message.updateMany({
        where: {
          conversationId,
          receiverId: currentParticipantId,
          isRead: false,
        },
        data: { isRead: true },
      });
    }

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    return messages;
  }

  /**
   * Send a message
   */
  async sendMessage(dto: {
    conversationId: string;
    senderId: string;
    senderType: string;
    receiverId: string;
    receiverType: string;
    content: string;
    mediaUrl?: string;
  }) {
    const message = await this.prisma.message.create({
      data: {
        conversationId: dto.conversationId,
        senderId: dto.senderId,
        senderType: dto.senderType,
        receiverId: dto.receiverId,
        receiverType: dto.receiverType,
        content: dto.content,
        mediaUrl: dto.mediaUrl || null,
        isRead: false,
      },
    });

    // Update conversation lastMessage & timestamp
    await this.prisma.conversation.update({
      where: { id: dto.conversationId },
      data: {
        lastMessage: dto.content,
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return message;
  }

  /**
   * Get total unread messages count for a participant
   */
  async getUnreadCount(participantId: string) {
    if (!participantId) return { unreadCount: 0 };
    const unreadCount = await this.prisma.message.count({
      where: {
        receiverId: participantId,
        isRead: false,
      },
    });

    return { unreadCount };
  }

  /**
   * Helper to fetch name and image for a participant (User or Business)
   */
  private async getParticipantInfo(id: string, type: string) {
    if (type === 'business') {
      const biz = await this.prisma.business.findUnique({
        where: { id },
        select: { id: true, businessName: true, logoUrl: true },
      });
      return {
        id,
        type: 'business',
        name: biz?.businessName || 'Negocio',
        avatar: biz?.logoUrl || null,
      };
    } else {
      const usr = await this.prisma.user.findUnique({
        where: { id },
        select: { id: true, displayName: true, firstName: true, lastName: true, avatarUrl: true },
      });
      const name = usr?.displayName || (usr?.firstName ? `${usr.firstName} ${usr.lastName || ''}`.trim() : 'Usuario');
      return {
        id,
        type: 'user',
        name,
        avatar: usr?.avatarUrl || null,
      };
    }
  }
}
