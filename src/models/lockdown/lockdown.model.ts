import { model } from "mongoose";
import lockdownSchema from "./schema";

export default model("Lockdown", lockdownSchema);
