import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LikeModule } from './likes/like.module';
import { CorrelationIdMiddleware } from './common/middlewares/correlation-id';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Like } from './common/entities/like.entity';
import { Post } from './common/entities/post.entity';
import { PostCountEvent } from './common/entities/post-count-event.entity';
import configuration from './common/config/config-loader';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [Like, Post, PostCountEvent],
        synchronize: false,
      }),
    }),
    LikeModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
