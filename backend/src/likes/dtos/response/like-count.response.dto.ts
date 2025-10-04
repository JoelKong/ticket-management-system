import { ApiProperty } from '@nestjs/swagger';

export class LikeCountResponseDto {
  @ApiProperty({
    description: 'Current number of likes for the post',
    example: 42,
  })
  count: number;

  @ApiProperty({
    description: 'Post identifier',
    example: 123,
  })
  post_id: number;

  @ApiProperty({
    description: 'Whether the current user has liked this post',
    example: true,
    required: false,
  })
  isLiked?: boolean;

  @ApiProperty({
    description: 'User identifier (if provided)',
    example: 1,
    required: false,
  })
  user_id?: number;
}
