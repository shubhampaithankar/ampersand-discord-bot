export type CounterActorType = "everyone" | "role" | "user" | "admin";

export interface CounterActor {
  type: CounterActorType;
  targetId?: string | null;
}

export interface CounterData {
  guildId: string;
  name: string;
  value: number;
  actor: CounterActor;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}
