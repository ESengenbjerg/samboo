// Helpers on top of the generated database.types.ts, which has Tables<>, TablesInsert<> and Enums<> but nothing for functions.

import type { Database } from "./database.types.ts";

type Functions = Database["public"]["Functions"];

// One row of a function that returns a table (RETURNS TABLE / SETOF)
type RowOf<Fn extends keyof Functions> = Functions[Fn]["Returns"] extends (infer Row)[] ? Row : never;

// One row of what an RPC returns, e.g. RpcRow<"my_pending_invites">.
// The generator marks every column of RETURNS TABLE as not null, since Postgres does not say which can be null.
// List the columns that can be null as the second argument: RpcRow<"my_showing_events", "address" | "start_time">
export type RpcRow<
  Fn extends keyof Functions,
  Nullable extends keyof RowOf<Fn> = never,
> = Omit<RowOf<Fn>, Nullable> & { [Column in Nullable]: RowOf<Fn>[Column] | null };
