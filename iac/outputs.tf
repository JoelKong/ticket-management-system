output "api_gateway_url" {
  description = "API Gateway URL"
  value       = aws_api_gateway_deployment.api.invoke_url
}

output "frontend_url" {
  description = "Frontend CloudFront URL"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "dynamodb_tables" {
  description = "DynamoDB table names"
  value = {
    users    = aws_dynamodb_table.users.name
    concerts = aws_dynamodb_table.concerts.name
    seats    = aws_dynamodb_table.seats.name
    bookings = aws_dynamodb_table.bookings.name
  }
}

output "redis_endpoint" {
  description = "Redis endpoint"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
  sensitive   = true
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "private_subnets" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnets
}

output "public_subnets" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnets
}
