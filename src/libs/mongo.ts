import mongoose from "mongoose";

import { MONGO_URL } from "../constants";

export const connectToMongo = async () => {
  const mongo = await mongoose.connect(MONGO_URL!);
  console.log(`Connected to database: ${mongo.connection.db?.databaseName}`);
  return mongo.connection.db;
};
