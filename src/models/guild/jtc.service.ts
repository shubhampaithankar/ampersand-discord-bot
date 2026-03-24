import Guild from "./guild.model";

export const getJTC = (guildId: string) =>
  Guild.findOne({ guildId })
    .select("jtc")
    .lean()
    .catch(() => null);

export const updateJTC = (guildId: string, updateQuery: any) =>
  Guild.findOneAndUpdate(
    { guildId },
    {
      $set: { jtc: updateQuery },
    },
    { upsert: true },
  )
    .lean()
    .catch((e) => console.log("Database Error: while updating JTC data:\n", e));
