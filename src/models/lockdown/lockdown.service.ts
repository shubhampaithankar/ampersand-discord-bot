import Lockdown from "./lockdown.model";

export const getLockdown = (guildId: string) =>
  Lockdown.findOne({ guildId })
    .lean()
    .catch(() => null);

export const updateLockdown = (guildId: string, updateQuery: any) =>
  Lockdown.findOneAndUpdate({ guildId }, updateQuery, { upsert: true })
    .lean()
    .catch((e) =>
      console.log("Database Error: while updating lockdown data:\n", e),
    );
