import { NestFactory } from "@nestjs/core";

import { AssetCategorySeeder } from "./category.seed";
import { SeederModule } from "./seeder.module";

async function seed() {
  const app = await NestFactory.createApplicationContext(SeederModule);

  const categorySeeder = app.get(AssetCategorySeeder);

  try {
    await categorySeeder.drop();
    await categorySeeder.seed();
    console.log("Seeding completed successfully!");
  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await app.close();
  }
}

seed();
