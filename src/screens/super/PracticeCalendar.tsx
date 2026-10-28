"use client";
import * as React from "react";
import { complianceClients, yearEventsFor } from "@/data/staff-compliance";
import { StaffCalendar } from "@/screens/staff/CalendarScreen";

// Old super admin Practice · Compliances (reference/old-screens/s/super/CompCal.dc.html):
// the client calendar with "All companies", filing names on each day and the next-deadline card.
// The super admin sees every compliance client, as the admin does. The Filings button sits in the calendar bar, as in the old toolbar.

export function PracticeCalendar() {
  const [client, setClient] = React.useState("");
  return (
    <StaffCalendar
      events={yearEventsFor("admin", client)}
      clients={complianceClients("admin")}
      client={client}
      onClient={setClient}
      hrefFor={(e) => `/super/clients/${e.client}`}
      filingsHref="/super/practice/filings"
    />
  );
}
