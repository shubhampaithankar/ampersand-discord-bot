import { model } from "mongoose";
import counterSchema from "./counter.schema";

export default model("Counter", counterSchema);
