// Display words for status values. The stored value stays "With client" (types in staff-tasks, staff-clients, super).
// STATUS open item 3: "Waiting on client" does not fit the 108 px table chip, so tables keep "With client".
// Record heads, step heads, cards, legends and rails use the old words "Waiting on client".

/** The old display word for a status outside a fixed-width table chip. */
export function waitWord<T extends string>(status: T): string {
  return status === "With client" ? "Waiting on client" : status;
}
