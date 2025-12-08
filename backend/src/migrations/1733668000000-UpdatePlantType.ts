import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatePlantType1733668000000 implements MigrationInterface {
    name = 'UpdatePlantType1733668000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "plant_new" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "name" varchar NOT NULL,
                "strain" varchar NOT NULL,
                "breeder" varchar,
                "phenotype" varchar,
                "start_method" varchar NOT NULL DEFAULT ('seed') CHECK(start_method IN ('seed', 'clone')),
                "plant_type" varchar NOT NULL DEFAULT ('photoperiod') CHECK(plant_type IN ('autoflower', 'photoperiod')),
                "phases" text NOT NULL,
                "medium" varchar NOT NULL CHECK(medium IN ('soil', 'coco', 'hydro', 'dwc')),
                "pot_size_liters" real NOT NULL,
                "training_methods" text NOT NULL,
                "notes" text,
                "is_active" boolean NOT NULL DEFAULT (1),
                "is_mother_plant" boolean NOT NULL DEFAULT (0),
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "events" text NOT NULL DEFAULT ('[]')
            )
        `);

        // Migrate data: regular/feminized -> photoperiod, autoflower stays, aero -> dwc
        await queryRunner.query(`
            INSERT INTO "plant_new" (id, name, strain, breeder, phenotype, start_method, plant_type, phases, medium, pot_size_liters, training_methods, notes, is_active, is_mother_plant, created_at, updated_at, events)
            SELECT id, name, strain, breeder, phenotype, start_method,
                   CASE WHEN plant_type = 'autoflower' THEN 'autoflower' ELSE 'photoperiod' END,
                   phases,
                   CASE WHEN medium = 'aero' THEN 'dwc' ELSE medium END,
                   pot_size_liters, training_methods, notes, is_active, is_mother_plant, created_at, updated_at, events
            FROM "plant"
        `);

        await queryRunner.query(`DROP TABLE "plant"`);
        await queryRunner.query(`ALTER TABLE "plant_new" RENAME TO "plant"`);

        console.log('✅ Updated plant_type constraint to autoflower/photoperiod');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "plant_new" (
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

        await queryRunner.query(`
            INSERT INTO "plant_new" SELECT * FROM "plant"
        `);

        await queryRunner.query(`DROP TABLE "plant"`);
        await queryRunner.query(`ALTER TABLE "plant_new" RENAME TO "plant"`);
    }
}
