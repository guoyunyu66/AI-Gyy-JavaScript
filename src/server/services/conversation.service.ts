import { PrismaClient, Prisma } from '@prisma/client'
import { logger } from '@/lib/logger'

// 类型定义 (可以从 prisma 生成的类型导入，或者根据需要定义)
interface MessageData {
  role: string; // 'user' | 'assistant'
  content: string;
  tokens?: number;
  thinkingProcess?: string;
}

const log = logger.child({ module: 'conversation-service' })

export class ConversationService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // 创建新会话
  async createConversation(userId: string, title: string = 'New Chat', model?: string) {
    try {
      log.debug({ userId, title, model }, '尝试创建新会话')
      const conversation = await this.prisma.conversation.create({
        data: {
          userId,
          title,
          model,
        },
      });
      log.info({ conversationId: conversation.id, userId, title }, '新会话创建成功')
      return conversation;
    } catch (error: any) {
      const errorDetails = {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code, // For Prisma errors like P2003
        meta: error.meta, // For Prisma error metadata
        clientVersion: error.clientVersion // For Prisma client version
      };
      log.error({
        userId,
        title,
        model,
        error: errorDetails
      }, '创建会话时数据库操作失败');
      // 根据实际错误处理策略，可以抛出自定义错误或返回null/错误对象
      // 抛出原始错误或一个包含更多上下文的新错误，而不是通用错误
      // throw error; // 或者 throw new Error(`Failed to create conversation: ${error.message}`);
      // 为了让上层能获取到 Prisma 特有的 code 等信息，直接抛出原始 error 可能更好，
      // 或者确保包装后的错误也携带这些信息。
      // 目前上层 chat.lib.ts 已经会处理 error.code 等，所以这里可以直接抛出原始错误。
      throw error;
    }
  }

  // 获取用户的所有会话 (不含消息详情，仅列表)
  async getAllConversations(userId: string) {
    try {
      const conversations = await this.prisma.conversation.findMany({
        where: { userId },
        orderBy: {
          updatedAt: 'desc', // 最近更新的会话排在前面
        },
        select: { // 选择需要的字段，避免传输过多数据
          id: true,
          title: true,
          model: true,
          createdAt: true,
          updatedAt: true,
          // messages: false, // 明确不选择消息
        }
      });
      return conversations;
    } catch (error) {
      console.error('Error fetching all conversations:', error);
      throw new Error('Could not fetch conversations.');
    }
  }

  // 获取特定会话 (确保用户权限), 包含消息
  async getConversationById(id: string, userId: string) {
    try {
      const conversation = await this.prisma.conversation.findUnique({
        where: {
          id,
          userId, // 确保是该用户的会话
        },
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc', // 消息按时间正序排列
            },
          },
        },
      });
      if (!conversation) {
        // 可以选择抛出 NotFoundError 或者返回 null
        return null;
      }
      return conversation;
    } catch (error) {
      console.error(`Error fetching conversation by id ${id}:`, error);
      throw new Error('Could not fetch conversation details.');
    }
  }

  // 删除会话 (确保用户权限)
  async deleteConversation(id: string, userId: string) {
    try {
      // 首先验证会话是否属于该用户
      const conversation = await this.prisma.conversation.findUnique({
        where: { id, userId },
      });

      if (!conversation) {
        // 如果会话不存在或不属于该用户，则认为删除失败或无权限
        // 根据业务需求，可以抛出 NotFoundError 或 ForbiddenError，或者返回特定的状态
        // return { success: false, message: 'Conversation not found or access denied.' };
        throw new Error('Conversation not found or access denied.');
      }

      await this.prisma.conversation.delete({
        where: { id }, // Prisma 会自动处理关联消息的删除 (基于 schema 中的 onDelete: Cascade)
      });
      return { success: true, message: 'Conversation deleted successfully.' };
    } catch (error) {
      console.error(`Error deleting conversation ${id}:`, error);
      // 检查是否是 Prisma 特定的记录未找到错误，如果是，可能意味着已被删除或ID无效
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new Error('Conversation to delete not found.');
      }
      throw new Error('Could not delete conversation.');
    }
  }

  // 获取会话的所有消息 (确保用户权限)
  // 注意：getConversationById 已经可以包含消息了，这个方法可能冗余，除非有特殊需求
  // 比如只想要消息列表，或者有不同的权限控制。
  // 为保持完整性，我们依然实现它，但建议根据实际场景决定是否保留。
  async getConversationMessages(conversationId: string, userId: string) {
    try {
      // 首先验证用户是否有权访问该会话
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId, userId },
        select: { id: true } // 只需要知道会话是否存在且属于用户即可
      });

      if (!conversation) {
        throw new Error('Conversation not found or access denied.');
      }

      const messages = await this.prisma.message.findMany({
        where: { conversationId },
        orderBy: {
          createdAt: 'asc',
        },
      });
      return messages;
    } catch (error) {
      console.error(`Error fetching messages for conversation ${conversationId}:`, error);
      throw new Error('Could not fetch messages.');
    }
  }

  // 向会话添加消息
  async addMessageToConversation(conversationId: string, messageData: MessageData) {
    try {
      // 可选：验证 conversationId 是否存在，防止向无效会话添加消息
      // const conversationExists = await this.prisma.conversation.findUnique({ where: { id: conversationId }, select: { id: true }});
      // if (!conversationExists) {
      //   throw new Error('Conversation not found.');
      // }

      const message = await this.prisma.message.create({
        data: {
          conversationId,
          role: messageData.role,
          content: messageData.content,
          tokens: messageData.tokens,
          thinkingProcess: messageData.thinkingProcess,
        },
      });
      return message;
    } catch (error) {
      console.error(`Error adding message to conversation ${conversationId}:`, error);
      throw new Error('Could not add message.');
    }
  }
}

// 导出服务实例，方便在其他地方直接使用
export const conversationService = new ConversationService(); 