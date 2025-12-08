import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1733666000000 implements MigrationInterface {
    name = 'InitialSchema1733666000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create strains table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "strains" (
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

        // Create plant table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "plant" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "name" varchar NOT NULL,
                "strain" varchar NOT NULL,
                "breeder" varchar,
                "phenotype" varchar,
                "start_method" varchar NOT NULL CHECK(start_method IN ('seed', 'clone')),
                "plant_type" varchar NOT NULL CHECK(plant_type IN ('regular', 'feminized', 'autoflower')),
                "phases" text NOT NULL,
                "medium" varchar CHECK(medium IN ('soil', 'coco', 'hydro', 'aero')),
                "pot_size_liters" integer,
                "training_methods" text NOT NULL,
                "notes" text NOT NULL DEFAULT (''),
                "is_active" boolean NOT NULL DEFAULT (1),
                "is_mother_plant" boolean NOT NULL DEFAULT (0),
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "events" text NOT NULL DEFAULT ('[]')
            )
        `);

        console.log('✅ Database tables created successfully');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "plant"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "strains"`);
    }
}
