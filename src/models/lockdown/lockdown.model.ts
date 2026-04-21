import { model } from "mongoose";
import lockdownSchema from "./lockdown.schema";

export default model("Lockdown", lockdownSchema);
