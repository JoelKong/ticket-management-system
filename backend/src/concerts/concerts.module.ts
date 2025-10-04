import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Concert } from '../common/entities/concert.entity';
import { Seat } from '../common/entities/seat.entity';
import { Booking } from '../common/entities/booking.entity';
import { ConcertsController } from './concerts.controller';
import { ConcertsService } from './concerts.service';
import { RedisService } from '../redis/redis.service';
import { StripeService } from '../stripe/stripe.service';

@Module({
  imports: [TypeOrmModule.forFeature([Concert, Seat, Booking])],
  controllers: [ConcertsController],
  providers: [ConcertsService, RedisService, StripeService],
  exports: [ConcertsService],
})
export class ConcertsModule {}
