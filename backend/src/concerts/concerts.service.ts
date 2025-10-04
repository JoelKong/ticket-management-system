import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ObjectId } from 'typeorm';
import { Concert } from '../common/entities/concert.entity';
import { Seat } from '../common/entities/seat.entity';
import { Booking } from '../common/entities/booking.entity';
import { CreateConcertDto } from './dto/create-concert.dto';
import { ReserveSeatDto } from './dto/reserve-seat.dto';
import { RedisService } from '../redis/redis.service';
import { StripeService } from '../stripe/stripe.service';

@Injectable()
export class ConcertsService {
  constructor(
    @InjectRepository(Concert)
    private concertRepository: Repository<Concert>,
    @InjectRepository(Seat)
    private seatRepository: Repository<Seat>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    private redisService: RedisService,
    private stripeService: StripeService,
  ) {}

  async createConcert(createConcertDto: CreateConcertDto): Promise<Concert> {
    const concert = this.concertRepository.create({
      ...createConcertDto,
      availableSeats: createConcertDto.totalSeats,
      status: 'upcoming',
    });

    const savedConcert = await this.concertRepository.save(concert);

    // Create seats for the concert
    const seats = await this.createSeatsForConcert(
      savedConcert.id.toString(),
      createConcertDto.totalSeats,
    );

    // Initialize Redis with seat availability
    await this.redisService.initializeConcertSeats(
      savedConcert.id.toString(),
      seats,
    );

    return savedConcert;
  }

  async findAllConcerts(): Promise<Concert[]> {
    return this.concertRepository.find({
      relations: ['seats'],
      order: { date: 'ASC' },
    });
  }

  async findOneConcert(id: string): Promise<Concert> {
    const concert = await this.concertRepository.findOne({
      where: { id: new ObjectId(id) },
      relations: ['seats'],
    });

    if (!concert) {
      throw new NotFoundException('Concert not found');
    }

    return concert;
  }

  async getSeatAvailability(concertId: string): Promise<any[]> {
    const concert = await this.findOneConcert(concertId);
    const redisAvailability =
      await this.redisService.getSeatAvailability(concertId);

    return concert.seats.map((seat) => {
      const redisSeat = redisAvailability.find(
        (rs) => rs.seatId === seat.id.toString(),
      );
      return {
        ...seat,
        redisStatus: redisSeat?.status || 'available',
        reservedUntil: redisSeat?.reservedUntil,
      };
    });
  }

  async reserveSeat(
    reserveSeatDto: ReserveSeatDto,
    userId: string,
  ): Promise<{ booking: Booking; clientSecret: string }> {
    const { concertId, seatId } = reserveSeatDto;

    // Check if concert exists
    const concert = await this.findOneConcert(concertId);

    // Check if seat exists
    const seat = await this.seatRepository.findOne({
      where: { id: new ObjectId(seatId), concertId: concertId },
    });

    if (!seat) {
      throw new NotFoundException('Seat not found');
    }

    // Check if user already has a pending booking for this concert
    const existingBooking = await this.bookingRepository.findOne({
      where: {
        userId: new ObjectId(userId),
        seat: { concertId },
        status: 'pending',
      },
    });

    if (existingBooking) {
      throw new ConflictException(
        'You already have a pending booking for this concert',
      );
    }

    // Try to reserve seat in Redis
    const reservationSuccess = await this.redisService.reserveSeatStatus(
      concertId,
      seatId,
      userId,
    );

    if (!reservationSuccess) {
      throw new ConflictException('Seat is not available or already reserved');
    }

    // Create payment intent
    const paymentIntent = await this.stripeService.createPaymentIntent(
      seat.price,
      'usd',
      {
        userId,
        concertId,
        seatId,
      },
    );

    // Create booking record
    const booking = this.bookingRepository.create({
      userId,
      seatId,
      stripePaymentIntentId: paymentIntent.id,
      amount: seat.price,
      status: 'pending',
    });

    const savedBooking = await this.bookingRepository.save(booking);

    return {
      booking: savedBooking,
      clientSecret: paymentIntent.client_secret || '',
    };
  }

  async confirmBooking(
    paymentIntentId: string,
    userId: string,
  ): Promise<Booking> {
    // Find booking
    const booking = await this.bookingRepository.findOne({
      where: {
        stripePaymentIntentId: paymentIntentId,
        userId: new ObjectId(userId),
      },
      relations: ['seat', 'user'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== 'pending') {
      throw new BadRequestException('Booking is not in pending status');
    }

    // Confirm payment with Stripe
    const paymentIntent =
      await this.stripeService.confirmPaymentIntent(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      throw new BadRequestException('Payment was not successful');
    }

    // Update booking status
    booking.status = 'confirmed';
    booking.confirmedAt = new Date();

    // Update seat status in DynamoDB
    const seat = booking.seat;
    seat.status = 'sold';

    // Confirm seat reservation in Redis
    await this.redisService.confirmSeatReservation(
      seat.concertId.toString(),
      seat.id.toString(),
    );

    // Save changes
    await this.seatRepository.save(seat);
    const confirmedBooking = await this.bookingRepository.save(booking);

    // Update concert available seats count
    await this.updateConcertAvailableSeats(seat.concertId);

    return confirmedBooking;
  }

  async cancelBooking(bookingId: string, userId: string): Promise<void> {
    const booking = await this.bookingRepository.findOne({
      where: { id: new ObjectId(bookingId), userId: new ObjectId(userId) },
      relations: ['seat'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== 'pending') {
      throw new BadRequestException('Only pending bookings can be cancelled');
    }

    // Cancel payment intent
    await this.stripeService.cancelPaymentIntent(booking.stripePaymentIntentId);

    // Release seat reservation
    await this.redisService.releaseSeatReservation(
      booking.seat.concertId.toString(),
      booking.seat.id.toString(),
    );

    // Update booking status
    booking.status = 'failed';
    await this.bookingRepository.save(booking);
  }

  async getUserBookings(userId: string): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: { userId: new ObjectId(userId) },
      relations: ['seat', 'seat.concert'],
      order: { createdAt: 'DESC' },
    });
  }

  private async createSeatsForConcert(
    concertId: string,
    totalSeats: number,
  ): Promise<Seat[]> {
    const seats: Partial<Seat>[] = [];

    // Simple seat generation logic - can be enhanced for specific venue layouts
    for (let i = 1; i <= totalSeats; i++) {
      const seatNumber = `S${i}`;
      const row = `Row ${Math.ceil(i / 20)}`;
      const section = `Section ${Math.ceil(i / 100)}`;

      seats.push({
        concertId,
        seatNumber,
        row,
        section,
        price: 150, // Base price + dynamic pricing could be implemented
        status: 'available',
      });
    }

    return this.seatRepository.save(seats);
  }

  private async updateConcertAvailableSeats(concertId: string): Promise<void> {
    const soldSeats = await this.seatRepository.count({
      where: { concertId, status: 'sold' },
    });

    await this.concertRepository.update(concertId, {
      availableSeats: await this.seatRepository.count({
        where: { concertId, status: 'available' },
      }),
    });
  }
}
