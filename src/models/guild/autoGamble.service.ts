import Guild from "./guild.model";

export const getAutoGamble = (guildId: string) =>
  Guild.findOne({ guildId })
    .select("autoGamble")
    .lean()
    .catch(() => null);

export const updateAutoGamble = (
  guildId: string,
  updateQuery: Partial<{
    enabled: boolean;
    channelIds: string[];
    chance: number;
    timeoutDuration: number;
  }>,
) =>
  Guild.findOneAndUpdate(
    { guildId },
    {
      $set: Object.fromEntries(Object.entries(updateQuery).map(([k, v]) => [`autoGamble.${k}`, v])),
    },
    { upsert: true },
  )
    .lean()
    .catch((e) => console.log("Database Error: while updating autoGamble data:\n", e));

export const addAutoGambleChannel = (guildId: string, channelId: string) =>
  Guild.findOneAndUpdate(
    { guildId },
    { $addToSet: { "autoGamble.channelIds": channelId } },
    { upsert: true },
  )
    .lean()
    .catch((e) => console.log("Database Error: while adding autoGamble channel:\n", e));

export const removeAutoGambleChannel = (guildId: string, channelId: string) =>
  Guild.findOneAndUpdate({ guildId }, { $pull: { "autoGamble.channelIds": channelId } })
    .lean()
    .catch((e) => console.log("Database Error: while removing autoGamble channel:\n", e));
