import { model } from "mongoose";
import lockdownSchema from "@/models/lockdown/lockdown.schema";

export default model("Lockdown", lockdownSchema);
