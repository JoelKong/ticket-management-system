import { config } from 'dotenv';

export default () => {
  // Load environment variables from the appropriate .env file
  config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

  return {
    // Database Configuration
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
    DB_USERNAME: process.env.DB_USERNAME || 'postgres',
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_DATABASE: process.env.DB_DATABASE || 'scalable_likes_system',

    // Application Configuration
    PORT: parseInt(process.env.PORT || '3001', 10),

    // Redis Configuration
    REDIS_HOST: process.env.REDIS_HOST || 'redis',
    REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),

    // Kafka Configuration
    KAFKA_BROKER: process.env.KAFKA_BROKER || 'kafka:9092',
  };
};
