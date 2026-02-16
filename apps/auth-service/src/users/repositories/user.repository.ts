import { InjectModel } from "@nestjs/mongoose";

import { Model, RootFilterQuery } from "mongoose";

import { User, UserDocument } from "src/users/schema/user.schema";

import { UpdateUserDto } from "../dto/update-user.dto";

export class UserRepository {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}
  async create(userDetails: User) {
    const user = new this.userModel(userDetails);
    return user.save();
  }
  async find(email: string) {
    return this.userModel.findOne({ email });
  }

  async findById(id: string) {
    return this.userModel.findById(id);
  }

  async findAll() {
    return this.userModel.find();
  }

  async findByCognitoId(id: string): Promise<User> {
    return this.userModel.findOne({ cognitoSubId: id });
  }

  async update(userDetails: Partial<User>) {
    return this.userModel.updateOne({ email: userDetails.email }, userDetails);
  }

  async updateOne(query, userDetails: Partial<User>) {
    return this.userModel.updateOne(query, userDetails);
  }

  async updateById(id: string, userDetails: UpdateUserDto) {
    return this.userModel.updateOne({ _id: id }, userDetails);
  }

  async getUser(
    query: RootFilterQuery<UserDocument>,
  ): Promise<UserDocument[] | []> {
    return this.userModel.find(query);
  }
}
