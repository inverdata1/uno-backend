import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { BusinessesModule } from './businesses/businesses.module';
import { ProductsModule } from './products/products.module';
import { JwtAuthGuard } from './auth/jwt.guard';
import { AuthModule } from './auth/auth.module';
import { AddressTypesModule } from './address-types/address-types.module';
import { VenezuelanStatesModule } from './venezuelan-states/venezuelan-states.module';
import { AddressesModule } from './addresses/addresses.module';
import { OrdersModule } from './orders/orders.module';
import { CategoriesModule } from './categories/categories.module';
import { UploadModule } from './upload/upload.module';
import { StoriesModule } from './stories/stories.module';
import { PostsModule } from './posts/posts.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CommentsModule } from './comments/comments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    UsersModule,
    BusinessesModule,
    ProductsModule,
    AuthModule,
    AddressTypesModule,
    VenezuelanStatesModule,
    AddressesModule,
    OrdersModule,
    CategoriesModule,
    UploadModule,
    StoriesModule,
    PostsModule,
    DashboardModule,
    CommentsModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
