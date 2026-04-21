import { model } from "mongoose";
import counterSchema from "@/models/counter/counter.schema";

export default model("Counter", counterSchema);
