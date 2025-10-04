import { IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LikeRequestDto {
  @ApiProperty({
    description: 'Unique identifier of the post to like/unlike',
    example: 123,
    type: 'number',
  })
  @IsNumber()
  @IsNotEmpty()
  post_id: number;

  @ApiProperty({
    description: 'Unique identifier of the user performing the action',
    example: 456,
    type: 'number',
  })
  @IsNumber()
  @IsNotEmpty()
  user_id: number;
}
