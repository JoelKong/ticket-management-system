import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Logger,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { LikeService } from './like.service';
import { LikeRequestDto } from './dtos/request/like.request.dto';
import { LikeResponseDto } from './dtos/response/like.response.dto';
import { LikeCountResponseDto } from './dtos/response/like-count.response.dto';

@ApiTags('likes')
@Controller('like')
export class LikeController {
  private readonly logger = new Logger(LikeController.name);

  constructor(private readonly likeService: LikeService) {}

  @Post()
  @ApiOperation({
    summary: 'Toggle like/unlike for a post',
    description: 'queues database write via Kafka for eventual consistency',
  })
  @ApiBody({ type: LikeRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Like toggled successfully',
    type: LikeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request payload',
  })
  async toggleLike(
    @Body() likeRequestDto: LikeRequestDto,
  ): Promise<LikeResponseDto> {
    this.logger.log(
      `Received like toggle request for post ${likeRequestDto.post_id}, user ${likeRequestDto.user_id}`,
    );
    return this.likeService.toggleLike(likeRequestDto);
  }

  @Get('count/:postId')
  @ApiOperation({
    summary: 'Get like count for a post',
    description: 'Returns real-time like count from Redis cache layer',
  })
  @ApiParam({
    name: 'postId',
    type: 'number',
    description: 'Unique identifier of the post',
    example: 123,
  })
  @ApiQuery({
    name: 'userId',
    type: 'number',
    description: 'User ID to check like status',
    example: 1,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Like count retrieved successfully',
    type: LikeCountResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found',
  })
  async getLikeCount(
    @Param('postId', ParseIntPipe) postId: number,
    @Query('userId', ParseIntPipe) userId?: number,
  ): Promise<LikeCountResponseDto> {
    this.logger.log(`Received request for like count of post ${postId}`);
    return this.likeService.getLikeCountWithUserStatus(postId, userId);
  }

  @Get('status/:postId/:userId')
  @ApiOperation({
    summary: 'Check if user has liked a post',
    description: 'Returns whether the user has liked the specific post',
  })
  @ApiParam({
    name: 'postId',
    type: 'number',
    description: 'Unique identifier of the post',
    example: 123,
  })
  @ApiParam({
    name: 'userId',
    type: 'number',
    description: 'Unique identifier of the user',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'User like status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        isLiked: { type: 'boolean', example: true },
        post_id: { type: 'number', example: 123 },
        user_id: { type: 'number', example: 1 },
      },
    },
  })
  async getUserLikeStatus(
    @Param('postId', ParseIntPipe) postId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    this.logger.log(`Checking like status for post ${postId}, user ${userId}`);
    const isLiked = await this.likeService.getUserLikeStatus(postId, userId);
    return {
      isLiked,
      post_id: postId,
      user_id: userId,
    };
  }
}
