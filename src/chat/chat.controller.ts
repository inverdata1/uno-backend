import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  getOrCreateConversation(@Body() body: { p1Id: string; p1Type: string; p2Id: string; p2Type: string }) {
    return this.chatService.getOrCreateConversation(body.p1Id, body.p1Type, body.p2Id, body.p2Type);
  }

  @Get('conversations')
  getConversations(@Query('participantId') participantId: string, @Query('participantType') participantType: string) {
    return this.chatService.getConversationsForParticipant(participantId, participantType);
  }

  @Get('conversations/:id/messages')
  getMessages(@Param('id') conversationId: string, @Query('currentParticipantId') currentParticipantId: string) {
    return this.chatService.getMessages(conversationId, currentParticipantId);
  }

  @Post('conversations/:id/messages')
  sendMessage(
    @Param('id') conversationId: string,
    @Body() body: { senderId: string; senderType: string; receiverId: string; receiverType: string; content: string; mediaUrl?: string },
  ) {
    return this.chatService.sendMessage({
      conversationId,
      ...body,
    });
  }

  @Get('unread-count')
  getUnreadCount(@Query('participantId') participantId: string) {
    return this.chatService.getUnreadCount(participantId);
  }
}
