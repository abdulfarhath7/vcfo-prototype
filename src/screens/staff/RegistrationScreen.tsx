"use client";
import { ItemScreen } from "./ItemScreen";
import { type StaffPortal } from "./parts";

// Staff registration record, as in reference/old-screens/s/lead/RegItem.dc.html (Item, kind "reg").
// The old screen opens Northwind · GST registration: key "northwind-gst".
export function RegistrationScreen({ portal, id }: { portal: StaffPortal; id: string }) {
  return <ItemScreen kind="reg" portal={portal} id={id} />;
}
