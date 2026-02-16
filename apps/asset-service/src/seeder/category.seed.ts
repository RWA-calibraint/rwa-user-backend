import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";

import { Model } from "mongoose";

import { AssetCategory } from "../assets/schemas/category.schema";

@Injectable()
export class AssetCategorySeeder {
  constructor(
    @InjectModel(AssetCategory.name)
    private categoryModel: Model<AssetCategory>,
  ) {}

  async drop() {
    await this.categoryModel.deleteMany({});
  }

  async seed() {
    console.log("Seeding Asset categories...");

    const categories = [
      { category: "Art" },
      { category: "Coins and stamps" },
      { category: "Cars" },
      { category: "Watches" },
      { category: "Jewellery" },
      { category: "Real estate properties" },
      { category: "Furniture" },
      { category: "Luxury antiques" },
    ];

    await this.categoryModel.insertMany(categories);
    console.log("Asset Categories seeded successfully!");
  }
}
