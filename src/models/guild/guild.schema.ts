import { Schema } from "mongoose";
import { AutoGambleSchema } from "@/models/guild/autoGamble/autoGamble.schema";
import { JTCSchema } from "@/models/guild/jtc/jtc.schema";
import { MusicSchema } from "@/models/guild/music/music.schema";

export default new Schema({
  guildId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  ownerId: {
    type: String,
    required: true,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
  music: {
    type: MusicSchema,
  },
  jtc: {
    type: JTCSchema,
  },
  autoGamble: {
    type: AutoGambleSchema,
  },
});
