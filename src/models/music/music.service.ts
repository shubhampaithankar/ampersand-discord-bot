import Music from "./music.model";

export const getMusic = (guildId: string) =>
  Music.findOne({ guildId })
    .lean()
    .catch(() => null);

export const updateMusic = (guildId: string, updateQuery: any) => {
  return Music.findOneAndUpdate({ guildId }, updateQuery, { upsert: true })
    .lean()
    .catch((e) =>
      console.log("Database Error: while updating music data:\n", e),
    );
};
