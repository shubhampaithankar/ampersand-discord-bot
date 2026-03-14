import JTC from "./jtc.model";

export const getJTC = (guildId: string) =>
  JTC.findOne({ guildId })
    .lean()
    .catch(() => null);

export const updateJTC = (guildId: string, updateQuery: any) =>
  JTC.findOneAndUpdate({ guildId }, updateQuery, { upsert: true })
    .lean()
    .catch((e) => console.log("Database Error: while updating JTC data:\n", e));
