import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReserveSeatDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  concertId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsUUID()
  seatId: string;
}

export class ConfirmBookingDto {
  @ApiProperty({ example: 'pi_1234567890abcdef' })
  @IsString()
  paymentIntentId: string;
}
