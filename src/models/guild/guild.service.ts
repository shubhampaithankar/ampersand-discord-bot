import Guild from "@/models/guild/guild.model";

export const getGuild = (guildId: string) =>
  Guild.findOne({ guildId })
    .lean()
    .catch(() => null);

export const createGuild = (body: any) =>
  Guild.create(body).catch((e) => console.log("Database Error: while adding guild data:\n", e));

export const updateGuild = (guildId: string, data: any) =>
  Guild.findOneAndUpdate({ guildId }, data)
    .lean()
    .catch((e) => console.log("Database Error: while updating guild data:\n", e));

export const deleteGuild = (guildId: string) =>
  Guild.findOneAndUpdate({ guildId }, { deleted: true })
    .lean()
    .catch((e) => console.log("Database Error: while deleting guild data:\n", e));
