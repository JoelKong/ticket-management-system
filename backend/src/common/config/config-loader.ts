import { config } from 'dotenv';

export default () => {
  // Load environment variables from the appropriate .env file
  config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

  return {
    // Database Configuration (MongoDB for local, DynamoDB for production)
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: parseInt(process.env.DB_PORT || '27017', 10),
    DB_USERNAME: process.env.DB_USERNAME || 'mongodb',
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_DATABASE: process.env.DB_DATABASE || 'ticket_management_system',

    // Application Configuration
    PORT: parseInt(process.env.PORT || '3000', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',

    // JWT Configuration
    JWT_SECRET:
      process.env.JWT_SECRET ||
      'your-super-secret-jwt-key-change-in-production',

    // Redis Configuration
    REDIS_HOST: process.env.REDIS_HOST || 'localhost',
    REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),

    // Stripe Configuration
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,

    // AWS Configuration (for production)
    AWS_REGION: process.env.AWS_REGION || 'us-east-1',
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  };
};
