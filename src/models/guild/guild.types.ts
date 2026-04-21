import type { AutoGambleData } from "./autoGamble/autoGamble.types";
import type { JtcData } from "./jtc/jtc.types";
import type { MusicData } from "./music/music.types";

export type GuildData = {
  guildId: string;
  name: string;
  ownerId: string;
  deleted: boolean;
  music?: MusicData;
  jtc?: JtcData;
  autoGamble?: AutoGambleData;
};
