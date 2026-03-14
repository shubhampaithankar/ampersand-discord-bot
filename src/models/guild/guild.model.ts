import { GuildSchema } from "./schema/guild.schema";
import { model } from "mongoose";

export default model("Guild", GuildSchema);
