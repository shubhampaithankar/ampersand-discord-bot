import { Schema } from "mongoose";
import { AutoGambleSchema } from "./autoGamble/autoGamble.schema";
import { JTCSchema } from "./jtc/jtc.schema";
import { MusicSchema } from "./music/music.schema";

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
