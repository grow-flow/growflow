import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateStrainType1733667000000 implements MigrationInterface {
    name = 'UpdateStrainType1733667000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop old check constraint and add new one for autoflower/photoperiod
        await queryRunner.query(`
            CREATE TABLE "strains_new" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "name" varchar NOT NULL UNIQUE,
                "abbreviation" varchar(4),
                "type" varchar NOT NULL DEFAULT ('photoperiod') CHECK(type IN ('autoflower', 'photoperiod')),
                "description" text,
                "breeder" varchar,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now'))
            )
        `);

        // Migrate existing data, mapping old types to new types
        await queryRunner.query(`
            INSERT INTO "strains_new" (id, name, abbreviation, type, description, breeder, created_at, updated_at)
            SELECT id, name, abbreviation, 'photoperiod', description, breeder, created_at, updated_at
            FROM "strains"
        `);

        // Replace old table
        await queryRunner.query(`DROP TABLE "strains"`);
        await queryRunner.query(`ALTER TABLE "strains_new" RENAME TO "strains"`);

        console.log('✅ Updated strain type constraint to autoflower/photoperiod');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert to old constraint
        await queryRunner.query(`
            CREATE TABLE "strains_new" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "name" varchar NOT NULL,
                "abbreviation" varchar,
                "type" varchar CHECK(type IN ('indica', 'sativa', 'hybrid', 'ruderalis')),
                "description" text,
                "breeder" varchar,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now'))
            )
        `);

        await queryRunner.query(`
            INSERT INTO "strains_new" (id, name, abbreviation, type, description, breeder, created_at, updated_at)
            SELECT id, name, abbreviation, type, description, breeder, created_at, updated_at
            FROM "strains"
        `);

        await queryRunner.query(`DROP TABLE "strains"`);
        await queryRunner.query(`ALTER TABLE "strains_new" RENAME TO "strains"`);
    }
}
