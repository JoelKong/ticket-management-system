import { ApiProperty } from '@nestjs/swagger';

export class LikeResponseDto {
  @ApiProperty({
    description: 'Indicates if the operation was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Human-readable message describing the result',
    example: 'Post liked successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Current like status for the user',
    example: true,
    required: false,
  })
  isLiked?: boolean;
}
