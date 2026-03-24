import Lockdown from "./lockdown.model";

export const getLockdown = (guildId: string) =>
  Lockdown.findOne({ guildId })
    .lean()
    .catch(() => null);

export const getAllActiveLockdowns = () =>
  Lockdown.find({ enabled: true })
    .lean()
    .catch(() => [] as any[]);

export const updateLockdown = (guildId: string, updateQuery: any) =>
  Lockdown.findOneAndUpdate(
    { guildId },
    { $set: updateQuery },
    { upsert: true, new: true },
  )
    .lean()
    .catch((e) =>
      console.log("Database Error: while updating lockdown data:\n", e),
    );
