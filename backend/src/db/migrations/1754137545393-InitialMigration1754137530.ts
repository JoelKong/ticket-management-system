import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration17541375301754137545393
  implements MigrationInterface
{
  name = 'InitialMigration17541375301754137545393';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create posts table
    await queryRunner.query(`
      CREATE TABLE "posts" (
        "id" bigserial PRIMARY KEY,
        "like_count" bigint NOT NULL DEFAULT 0
      )
    `);

    // Create likes table
    await queryRunner.query(`
      CREATE TABLE "likes" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "post_id" bigint NOT NULL,
        "user_id" bigint NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Create post_count_events table
    await queryRunner.query(`
      CREATE TABLE "post_count_events" (
        "event_id" uuid PRIMARY KEY,
        "post_id" bigint NOT NULL,
        "delta" integer NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'PENDING',
        "retry_count" integer NOT NULL DEFAULT 0,
        "processed_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Create indexes for likes table
    await queryRunner.query(
      `CREATE INDEX "IDX_likes_post_id" ON "likes" ("post_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_likes_user_id" ON "likes" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_likes_post_user_unique" ON "likes" ("post_id", "user_id")`,
    );

    // Create indexes for post_count_events table
    await queryRunner.query(
      `CREATE INDEX "IDX_post_count_events_post_id" ON "post_count_events" ("post_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_post_count_events_status" ON "post_count_events" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_post_count_events_processed_at" ON "post_count_events" ("processed_at")`,
    );

    // Insert some sample data for testing
    await queryRunner.query(`
      INSERT INTO "posts" ("id", "like_count") VALUES 
      (123, 0),
      (124, 5),
      (125, 10)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_post_count_events_processed_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_post_count_events_status"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_post_count_events_post_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_likes_post_user_unique"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_likes_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_likes_post_id"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "post_count_events"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "likes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "posts"`);
  }
}
