// types/user.ts
import { ObjectId } from "mongodb";

export interface IUser {
  _id: ObjectId;
  email: string;
  accountType: "user" | "seller" | "employer";
  stripeAccountId?: string;
  // …other fields
}
