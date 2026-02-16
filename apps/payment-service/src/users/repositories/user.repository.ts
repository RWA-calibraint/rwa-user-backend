import { InjectModel } from "@nestjs/mongoose";

import mongoose, {
  Model,
  RootFilterQuery,
  UpdateWriteOpResult,
} from "mongoose";

import { User, UserDocument } from "src/users/schema/user.schema";

export class UserRepository {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}
  async create(userDetails: User): Promise<User> {
    const user = new this.userModel(userDetails);
    return user.save();
  }
  async find(email: string): Promise<User | null> {
    return this.userModel.findOne({ email });
  }
  async findOneById(id: mongoose.Types.ObjectId): Promise<User | null> {
    return this.userModel.findById(id);
  }
  async update(userDetails: User): Promise<UpdateWriteOpResult> {
    return this.userModel.updateOne({ email: userDetails.email }, userDetails, {
      new: true,
    });
  }

  async findOne(
    query: RootFilterQuery<UserDocument>,
  ): Promise<UserDocument | null> {
    return this.userModel.findOne(query);
  }

  async updateStripeAccountId(
    email: string,
    stripeAccountId: string,
  ): Promise<User> {
    return this.userModel.findOneAndUpdate(
      { email },
      { $set: { stripeAccountId } },
      { new: true },
    );
  }

  async incrementRewardPoints(userId: mongoose.Types.ObjectId, points: number) {
    return this.userModel.findByIdAndUpdate(
      userId,
      { $inc: { rewardPoints: points } },
      { new: true },
    );
  }
}
