export const ATTRIBUTION_SOURCE = {
  NORMAL: "normal",
  VANITY: "vanity",
  SINGLE_USE: "singleUse",
  REJOIN: "rejoin",
  UNKNOWN: "unknown",
} as const;

/** Accounts younger than this at join time are flagged as likely-fake. */
export const FAKE_ACCOUNT_AGE_MS = 7 * 24 * 60 * 60 * 1000;
