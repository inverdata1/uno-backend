import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  private getDateFilters(startDate?: string, endDate?: string) {
    const filters: any = {};
    if (startDate) {
      filters.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filters.lte = end;
    }
    return Object.keys(filters).length > 0 ? filters : undefined;
  }

  async getNegocioMetrics(businessId: string, startDate?: string, endDate?: string) {
    const dateFilters = this.getDateFilters(startDate, endDate);
    
    const whereBase: any = { businessId };
    if (dateFilters) {
      whereBase.createdAt = dateFilters;
    }

    const COMPLETED_STATUSES = ['completed', 'delivered', 'ready'];

    // 1. Completed Tickets & Gross Revenue
    const completedOrders = await this.prisma.order.findMany({
      where: { ...whereBase, status: { in: COMPLETED_STATUSES } },
      select: { totalAmount: true, id: true }
    });
    const completedCount = completedOrders.length;
    const grossRevenue = completedOrders.reduce((acc, order) => acc + Number(order.totalAmount), 0);
    const completedOrderIds = completedOrders.map(o => o.id);

    // 2. Pending Orders
    const pendingCount = await this.prisma.order.count({
      where: { ...whereBase, status: 'pending' }
    });

    // 3. Products Sold
    let productsSold = 0;
    if (completedOrderIds.length > 0) {
      const orderItems = await this.prisma.orderItem.findMany({
        where: { orderId: { in: completedOrderIds } },
        select: { quantity: true }
      });
      productsSold = orderItems.reduce((acc, item) => acc + item.quantity, 0);
    }

    // 4. Top 5 Products
    let topProducts: any[] = [];
    if (completedOrderIds.length > 0) {
        const groupByProduct = await this.prisma.orderItem.groupBy({
          by: ['productId'],
          where: { orderId: { in: completedOrderIds } },
          _sum: { quantity: true },
          orderBy: { _sum: { quantity: 'desc' } },
          take: 5
        });

        const productIds = groupByProduct.map(g => g.productId);
        const productsInfo = await this.prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, thumbnailUrl: true, images: true, price: true }
        });

        topProducts = groupByProduct.map(g => {
          const prod = productsInfo.find(p => p.id === g.productId);
          return {
            ...prod,
            totalSold: g._sum.quantity
          };
        });
    }

    // 5. Recent Orders (3)
    const recentOrders = await this.prisma.order.findMany({
      where: whereBase,
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: {
        client: { select: { id: true, displayName: true, firstName: true, lastName: true, email: true } },
      }
    });

    return {
      metrics: {
        completedTickets: completedCount,
        pendingOrders: pendingCount,
        grossRevenue,
        productsSold
      },
      topProducts,
      recentOrders
    };
  }

  async getSocialMetrics(businessId: string, startDate?: string, endDate?: string) {
    const dateFilters = this.getDateFilters(startDate, endDate);
    
    const whereBase: any = { businessId, isActive: true };
    if (dateFilters) {
      whereBase.createdAt = dateFilters;
    }

    const posts = await this.prisma.post.findMany({
      where: whereBase,
      select: {
        id: true,
        type: true,
        title: true,
        caption: true,
        thumbnailUrl: true,
        media: true,
        likeCount: true,
        viewCount: true,
        commentCount: true,
        shareCount: true,
        taggedProducts: true,
        createdAt: true
      }
    });

    let totalLikes = 0;
    let totalViews = 0;
    let totalComments = 0;
    let totalShares = 0;

    posts.forEach(post => {
      totalLikes += post.likeCount;
      totalViews += post.viewCount;
      totalComments += post.commentCount;
      totalShares += post.shareCount;
    });

    // Sort descending by viewCount
    const sortedPosts = [...posts].sort((a, b) => b.viewCount - a.viewCount);
    
    return {
      metrics: {
        totalLikes,
        totalViews,
        totalComments,
        totalShares
      },
      topPosts: sortedPosts.slice(0, 3),
      bottomPosts: [...sortedPosts].reverse().slice(0, 3)
    };
  }
}
