"use client";
import { ItemScreen } from "./ItemScreen";
import { type StaffPortal } from "./parts";

// Staff obligation record, as in reference/old-screens/s/lead/ObItem.dc.html (Item, kind "ob").
// The old screen opens Northwind · GSTR-1: key "northwind-gstr1".
export function ObligationScreen({ portal, id }: { portal: StaffPortal; id: string }) {
  return <ItemScreen kind="ob" portal={portal} id={id} />;
}
