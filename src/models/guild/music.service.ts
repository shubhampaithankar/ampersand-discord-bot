import Guild from "./guild.model";

export const getMusic = (guildId: string) =>
  Guild.findOne({ guildId })
    .select("music")
    .lean()
    .catch(() => null);

export const updateMusic = (guildId: string, updateQuery: any) =>
  Guild.findOneAndUpdate(
    { guildId },
    {
      $set: { music: updateQuery },
    },
    { upsert: true },
  )
    .lean()
    .catch((e) =>
      console.log("Database Error: while updating music data:\n", e),
    );

export const addMusicChannel = (guildId: string, channelId: string) =>
  Guild.findOneAndUpdate(
    { guildId },
    { $addToSet: { "music.channelIds": channelId } },
    { upsert: true },
  )
    .lean()
    .catch((e) =>
      console.log("Database Error: while adding music channel:\n", e),
    );

export const removeMusicChannel = (guildId: string, channelId: string) =>
  Guild.findOneAndUpdate(
    { guildId },
    { $pull: { "music.channelIds": channelId } },
  )
    .lean()
    .catch((e) =>
      console.log("Database Error: while removing music channel:\n", e),
    );
