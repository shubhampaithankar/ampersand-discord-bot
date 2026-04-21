import type { AutoGambleData } from "@/models/guild/autoGamble/autoGamble.types";
import type { JtcData } from "@/models/guild/jtc/jtc.types";
import type { MusicData } from "@/models/guild/music/music.types";

export type GuildData = {
  guildId: string;
  name: string;
  ownerId: string;
  deleted: boolean;
  music?: MusicData;
  jtc?: JtcData;
  autoGamble?: AutoGambleData;
};
