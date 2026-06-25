import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1782352719449 implements MigrationInterface {
    name = 'Init1782352719449'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "messages" ("id" character varying NOT NULL, "session_id" character varying NOT NULL, "user_id" bigint NOT NULL, "parent_uuid" character varying, "role" character varying NOT NULL, "type" character varying NOT NULL, "is_prompt" boolean NOT NULL, "text" text, "model" character varying, "input_tokens" integer, "output_tokens" integer, "cache_creation_tokens" integer, "cache_read_tokens" integer, "event_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ff71b7760071ed9caba7f02beb" ON "messages"  ("session_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_bed8fb14afefa62d4bbcda4336" ON "messages"  ("role", "event_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_77f07e6497761b05601d5b7393" ON "messages"  ("is_prompt", "event_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_1ad4b72d261d8bff3b620984ed" ON "messages"  ("user_id", "event_at") `);
        await queryRunner.query(`CREATE TABLE "sessions" ("id" character varying NOT NULL, "user_id" bigint NOT NULL, "project_path" character varying, "git_branch" character varying, "cc_version" character varying, "started_at" TIMESTAMP WITH TIME ZONE, "last_event_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_085d540d9f418cfbdc7bd55bb1" ON "sessions"  ("user_id") `);
        await queryRunner.query(`CREATE TABLE "raw_uploads" ("id" BIGSERIAL NOT NULL, "uploaded_by" character varying NOT NULL, "source_file" character varying NOT NULL, "line_hash" character varying NOT NULL, "raw_json" jsonb NOT NULL, "uploaded_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "parsed_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_07c4e30dcc6a9eb3dd37a6993d5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_0eae60ba172cd2bcd7d986c7d6" ON "raw_uploads"  ("line_hash") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" BIGSERIAL NOT NULL, "email" character varying NOT NULL, "display_name" character varying, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users"  ("email") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0eae60ba172cd2bcd7d986c7d6"`);
        await queryRunner.query(`DROP TABLE "raw_uploads"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_085d540d9f418cfbdc7bd55bb1"`);
        await queryRunner.query(`DROP TABLE "sessions"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1ad4b72d261d8bff3b620984ed"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_77f07e6497761b05601d5b7393"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bed8fb14afefa62d4bbcda4336"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ff71b7760071ed9caba7f02beb"`);
        await queryRunner.query(`DROP TABLE "messages"`);
    }

}
