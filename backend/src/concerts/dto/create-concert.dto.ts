import {
  IsString,
  IsNumber,
  IsDateString,
  Min,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConcertDto {
  @ApiProperty({ example: 'Taylor Swift Eras Tour' })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'Experience the magic of Taylor Swift live in concert',
  })
  @IsString()
  description: string;

  @ApiProperty({ example: 'Taylor Swift' })
  @IsString()
  artist: string;

  @ApiProperty({ example: '2024-06-15T20:00:00Z' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 'Madison Square Garden' })
  @IsString()
  venue: string;

  @ApiProperty({ example: 'New York, NY' })
  @IsString()
  location: string;

  @ApiProperty({ example: 150, minimum: 0 })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiProperty({ example: 1000, minimum: 1 })
  @IsNumber()
  @Min(1)
  totalSeats: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
