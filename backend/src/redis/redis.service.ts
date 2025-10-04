import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface SeatAvailability {
  seatId: string;
  status: 'available' | 'reserved' | 'sold';
  reservedUntil?: string;
  userId?: string;
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;
  private readonly SEAT_RESERVATION_TTL = 300; // 5 minutes

  constructor(private configService: ConfigService) {
    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
    });

    this.client.on('connect', () => {
      this.logger.log('Connected to Redis');
    });

    this.client.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });
  }

  // Seat availability methods
  async getSeatAvailability(concertId: string): Promise<SeatAvailability[]> {
    const key = `concert:${concertId}:seats`;
    const seats = await this.client.hgetall(key);

    return Object.values(seats).map((seat) => JSON.parse(seat));
  }

  async reserveSeatStatus(
    concertId: string,
    seatId: string,
    userId: string,
  ): Promise<boolean> {
    const key = `concert:${concertId}:seats`;
    const lockKey = `concert:${concertId}:seat:${seatId}:lock`;

    try {
      // Try to acquire lock
      const lockAcquired = await this.client.set(
        lockKey,
        userId,
        'EX',
        5,
        'NX',
      );
      if (!lockAcquired) {
        return false; // Seat is being processed by another user
      }

      // Update seat status
      const seatData = {
        seatId,
        status: 'reserved',
        reservedUntil: new Date(
          Date.now() + this.SEAT_RESERVATION_TTL * 1000,
        ).toISOString(),
        userId,
      };

      await this.client.hset(key, seatId, JSON.stringify(seatData));
      await this.client.expire(key, this.SEAT_RESERVATION_TTL);

      this.logger.debug(
        `Reserved seat ${seatId} for user ${userId} (TTL: ${this.SEAT_RESERVATION_TTL}s)`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Error reserving seat ${seatId}:`, error);
      return false;
    }
  }

  async confirmSeatReservation(
    concertId: string,
    seatId: string,
  ): Promise<boolean> {
    const key = `concert:${concertId}:seats`;

    try {
      const seatData = await this.client.hget(key, seatId);
      if (!seatData) {
        return false;
      }

      const seat = JSON.parse(seatData);
      seat.status = 'sold';
      delete seat.reservedUntil;

      await this.client.hset(key, seatId, JSON.stringify(seat));
      this.logger.debug(`Confirmed reservation for seat ${seatId}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Error confirming reservation for seat ${seatId}:`,
        error,
      );
      return false;
    }
  }

  async releaseSeatReservation(
    concertId: string,
    seatId: string,
  ): Promise<boolean> {
    const key = `concert:${concertId}:seats`;

    try {
      const seatData = await this.client.hget(key, seatId);
      if (!seatData) {
        return false;
      }

      const seat = JSON.parse(seatData);
      seat.status = 'available';
      delete seat.reservedUntil;
      delete seat.userId;

      await this.client.hset(key, seatId, JSON.stringify(seat));

      // Clean up reservation lock
      const lockKey = `concert:${concertId}:seat:${seatId}:lock`;
      await this.client.del(lockKey);

      this.logger.debug(`Released reservation for seat ${seatId}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Error releasing reservation for seat ${seatId}:`,
        error,
      );
      return false;
    }
  }

  async initializeConcertSeats(concertId: string, seats: any[]): Promise<void> {
    const key = `concert:${concertId}:seats`;

    const seatData = {};
    seats.forEach((seat) => {
      seatData[seat.id] = JSON.stringify({
        seatId: seat.id,
        status: 'available',
        price: seat.price,
      });
    });

    await this.client.hset(key, seatData);
    await this.client.expire(key, 86400); // 24 hours
    this.logger.debug(
      `Initialized ${seats.length} seats for concert ${concertId}`,
    );
  }

  async cleanupExpiredReservations(): Promise<void> {
    const keys = await this.client.keys('concert:*:seats');

    for (const key of keys) {
      const seats = await this.client.hgetall(key);
      const now = new Date();

      for (const [seatId, seatData] of Object.entries(seats)) {
        const seat = JSON.parse(seatData);

        if (seat.status === 'reserved' && seat.reservedUntil) {
          if (new Date(seat.reservedUntil) < now) {
            await this.releaseSeatReservation(seat.concertId, seatId);
          }
        }
      }
    }
  }

  onModuleDestroy() {
    this.client.disconnect();
  }
}
