import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ConcertsService } from './concerts.service';
import { CreateConcertDto } from './dto/create-concert.dto';
import { ReserveSeatDto } from './dto/reserve-seat.dto';
import { ConfirmBookingDto } from './dto/reserve-seat.dto';

@ApiTags('Concerts')
@Controller('concerts')
export class ConcertsController {
  constructor(private readonly concertsService: ConcertsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new concert (Admin only)' })
  @ApiResponse({ status: 201, description: 'Concert created successfully' })
  async create(@Body() createConcertDto: CreateConcertDto) {
    return this.concertsService.createConcert(createConcertDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all concerts' })
  @ApiResponse({ status: 200, description: 'Concerts retrieved successfully' })
  async findAll() {
    return this.concertsService.findAllConcerts();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get concert by ID' })
  @ApiResponse({ status: 200, description: 'Concert retrieved successfully' })
  async findOne(@Param('id') id: string) {
    return this.concertsService.findOneConcert(id);
  }

  @Public()
  @Get(':id/seats')
  @ApiOperation({ summary: 'Get seat availability for a concert' })
  @ApiResponse({
    status: 200,
    description: 'Seat availability retrieved successfully',
  })
  async getSeatAvailability(@Param('id') id: string) {
    return this.concertsService.getSeatAvailability(id);
  }

  @Post('reserve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reserve a seat for a concert' })
  @ApiResponse({ status: 201, description: 'Seat reserved successfully' })
  @ApiResponse({ status: 409, description: 'Seat not available' })
  async reserveSeat(@Body() reserveSeatDto: ReserveSeatDto, @Request() req) {
    const userId = req.user.userId;
    return this.concertsService.reserveSeat(reserveSeatDto, userId);
  }

  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm a booking after successful payment' })
  @ApiResponse({ status: 200, description: 'Booking confirmed successfully' })
  @ApiResponse({
    status: 400,
    description: 'Payment failed or booking not found',
  })
  async confirmBooking(
    @Body() confirmBookingDto: ConfirmBookingDto,
    @Request() req,
  ) {
    const userId = req.user.userId;
    return this.concertsService.confirmBooking(
      confirmBookingDto.paymentIntentId,
      userId,
    );
  }

  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a pending booking' })
  @ApiResponse({ status: 200, description: 'Booking cancelled successfully' })
  async cancelBooking(@Body() body: { bookingId: string }, @Request() req) {
    const userId = req.user.userId;
    return this.concertsService.cancelBooking(body.bookingId, userId);
  }

  @Get('my/bookings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user bookings' })
  @ApiResponse({
    status: 200,
    description: 'User bookings retrieved successfully',
  })
  async getUserBookings(@Request() req) {
    const userId = req.user.userId;
    return this.concertsService.getUserBookings(userId);
  }
}
