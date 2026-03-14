import mongoose from "mongoose";

export const connectToMongo = async () => {
  const mongo = await mongoose.connect(process.env.MONGO_URL!);
  console.log(`Connected to database: ${mongo.connection.db?.databaseName}`);
  return mongo.connection.db;
};
