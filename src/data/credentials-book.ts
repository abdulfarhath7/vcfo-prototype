/* Credentials workbook (reference/old-screens/s/home/v7p_credentials.dc.html). Demo values only. */

export const CO_MAIL = "compliance@northwind-demo.in";
export const CO_MOBILE = "+91 98000 00010";

export type ColKind = "text" | "status" | "cert" | "sno";

export interface SheetCol {
  name: string;
  /** Hidden until the OTP check (password, ID, mobile). */
  secret?: boolean;
  kind?: ColKind;
  /** Identifier: IBM Plex Mono (R-28). */
  mono?: boolean;
}

export interface Sheet {
  id: "address" | "login" | "reg" | "kyc" | "other";
  label: string;
  cols: SheetCol[];
  rows: string[][];
  /** Rows whose every value is secret (Directors KYC: DOB, passport, Aadhaar, PAN). */
  secretRows?: number[];
  /** Row label column. */
  lab: number;
  add?: "row" | "director";
  /** Where auto-filled cells come from, by "row|col". */
  auto?: Record<string, string>;
}

export const STATUSES = ["Active", "Pending", "Expired", "Not applicable"] as const;

export const AUTO_SOURCE: Record<string, string> = {
  coi: "Company record (COI)",
  reg: "Registrations",
  profile: "Client profile",
  office: "Registered office (step 7)",
  inc: "Incorporation steps",
};

const ADDR_ROWS = [
  ["Registered office", "4B", "Northwind House", "12 Sample Road", "Indiranagar", "Near Demo Metro", "Bengaluru", "Bengaluru Urban", "Karnataka", "560038", "India", CO_MOBILE, "office@northwind-demo.in", "12.9716, 77.6412", "Rented", "Demo Owner One", "NOC.pdf", "Utility-bill-Sep-2026.pdf", "Rent-agreement.pdf"],
  ["Corporate office", "7", "Sample Tech Park", "80 Feet Road", "Koramangala", "Opp. Demo Mall", "Bengaluru", "Bengaluru Urban", "Karnataka", "560034", "India", "+91 98000 00011", "corp@northwind-demo.in", "12.9352, 77.6245", "Rented", "Demo Owner Two", "NOC.pdf", "Utility-bill-Sep-2026.pdf", "Rent-agreement.pdf"],
  ["Communication", "4B", "Northwind House", "12 Sample Road", "Indiranagar", "Near Demo Metro", "Bengaluru", "Bengaluru Urban", "Karnataka", "560038", "India", CO_MOBILE, "hello@northwind-demo.in", "12.9716, 77.6412", "Owned", "Northwind Technologies India Pvt Ltd", "", "Utility-bill-Sep-2026.pdf", ""],
];

export const ADDRESS_LINE = "4B, Northwind House, 12 Sample Road, Indiranagar, Bengaluru, Karnataka 560038, India";

/** Login credentials: label, ID after COI, source, password, status after, status before. null is a spacer row. */
const LOGINS: Array<[string, string, string, string, string, string] | null> = [
  ["Company CIN", "U72900KA2026FTC198431", "coi", "demo-pass-01", "Active", "Pending"],
  ["PAN", "AAKCN4821M", "coi", "demo-pass-02", "Active", "Pending"],
  ["TAN · TRACES registration", "BLRN04392D", "coi", "demo-pass-03", "Active", "Pending"],
  ["TAN · Income tax registration", "BLRN04392D", "coi", "demo-pass-04", "Active", "Pending"],
  ["Employee State Insurance (ESI)", "53001234560001001", "reg", "demo-pass-05", "Active", "Pending"],
  ["Provident Fund (PF)", "KNBNG2954118000", "reg", "demo-pass-06", "Active", "Pending"],
  ["Goods and Service Tax (GST)", "29AAKCN4821M1Z5", "reg", "demo-pass-07", "Active", "Pending"],
  ["GST · e-invoicing", "29AAKCN4821M1Z5", "reg", "demo-pass-08", "Active", "Pending"],
  ["LUT (letter of undertaking)", "AD291126001234X", "reg", "demo-pass-09", "Pending", "Pending"],
  ["HDFC Bank · bank logins", "NWT-NB-0001", "", "demo-pass-10", "Active", "Pending"],
  ["Shops and Establishment Act", "SE-DEMO-0001", "", "demo-pass-11", "Active", "Pending"],
  ["Professional tax", "PTEC-DEMO-0001", "reg", "demo-pass-12", "Active", "Pending"],
  ["Import Export Code (IEC)", "AAKCN4821M", "reg", "demo-pass-13", "Active", "Pending"],
  ["Mail ID · company", "office@northwind-demo.in", "profile", "demo-pass-14", "Active", "Active"],
  ["Non STPI", "STPI-DEMO-0001", "", "demo-pass-15", "Not applicable", "Not applicable"],
  ["RBI entity logins", "NWT-FIRMS-E01", "", "demo-pass-16", "Active", "Pending"],
  ["RBI business logins", "NWT-FIRMS-B01", "", "demo-pass-17", "Active", "Pending"],
  ["FLA", "FLA-DEMO-0001", "", "demo-pass-18", "Expired", "Not applicable"],
  ["TRACES", "BLRN04392D", "coi", "demo-pass-19", "Active", "Pending"],
  ["Zoho Books", "books@northwind-demo.in", "", "demo-pass-20", "Active", "Pending"],
  ["Papaya", "hr@northwind-demo.in", "", "demo-pass-21", "Active", "Pending"],
  ["Pluxee", "NWT-PLX-0001", "", "demo-pass-22", "Active", "Pending"],
  ["ADT-1", "SRN-DEMO-0001", "", "demo-pass-23", "Active", "Pending"],
  ["MCA V3 logins", "northwind.mca", "", "demo-pass-24", "Active", "Pending"],
  ["NPS", "NPS-CORP-0001", "", "demo-pass-25", "Pending", "Not applicable"],
  null,
  ["CBO", "NWT-CBO-0001", "", "demo-pass-26", "Active", "Pending"],
  ["POSH", "SHEBOX-DEMO-01", "", "demo-pass-27", "Active", "Pending"],
  ["FLAIR", "FLAIR-DEMO-01", "", "demo-pass-28", "Pending", "Pending"],
  ["Address", ADDRESS_LINE, "office", "", "Active", "Active"],
  ["JPMC logins", "NWT-JPMC-0001", "", "demo-pass-29", "Not applicable", "Not applicable"],
  ["Reporting portal", "NWT-RPT-0001", "", "demo-pass-30", "Active", "Pending"],
];

const REGS: string[][] = [
  ["GST registration", "29AAKCN4821M1Z5", "2 Oct 2026", "northwind.gst", "demo-pass-g1", "GST-REG-06.pdf"],
  ["PF registration", "KNBNG2954118000", "2 Nov 2026", "northwind.epfo", "demo-pass-p1", "PF-allotment.pdf"],
  ["ESI registration", "53001234560001001", "3 Nov 2026", "northwind.esic", "demo-pass-e1", "Proof pending"],
  ["PT registration", "PTEC-DEMO-0001", "5 Nov 2026", "northwind.pt", "demo-pass-t1", "PT-certificate.pdf"],
  ["LEI registration", "0000DEMO000000000001", "7 Nov 2026", "northwind.lei", "demo-pass-l1", "LEI-certificate.pdf"],
  ["MSME registration", "UDYAM-KR-03-0123456", "8 Nov 2026", "", "", "Udyam-certificate.pdf"],
  ["ICEGATE registration", "ICEGATE-DEMO-0001", "10 Nov 2026", "northwind.icegate", "demo-pass-c1", "Proof pending"],
  ["IEC registration", "AAKCN4821M", "10 Nov 2026", "northwind.dgft", "demo-pass-d1", "IEC-certificate.pdf"],
  ["LUT filing", "AD291126001234X", "12 Nov 2026", "", "", "LUT-acknowledgement.pdf"],
  ["Non-STPI compliance", "STPI-DEMO-0001", "14 Nov 2026", "northwind.stpi", "demo-pass-s1", "Proof pending"],
  ["Shops and establishment", "SE-DEMO-0001", "15 Nov 2026", "northwind.labour", "demo-pass-h1", "SE-certificate.pdf"],
  ["CLRA registration", "CLRA-DEMO-0001", "18 Nov 2026", "northwind.clra", "demo-pass-r1", "Proof pending"],
  ["POSH / SHE Box", "SHEBOX-DEMO-01", "18 Nov 2026", "northwind.shebox", "demo-pass-b1", "POSH-policy.pdf"],
  ["Trade licence", "TL-DEMO-0001", "20 Nov 2026", "", "", "Trade-licence.pdf"],
  ["Trademark registration", "TM-0000001", "22 Nov 2026", "northwind.ipindia", "demo-pass-m1", "Proof pending"],
  ["Trademark renewal", "TM-0000001-R", "", "", "", "Proof pending"],
  ["Patent registration", "PAT-DEMO-0001", "", "northwind.ipindia", "demo-pass-m1", "Proof pending"],
  ["ICDR registration", "ICDR-DEMO-0001", "25 Nov 2026", "", "", "ICDR-acknowledgement.pdf"],
  ["FCGPR filing", "FCGPR-DEMO-0001", "28 Nov 2026", "northwind.firms", "demo-pass-f1", "FCGPR-acknowledgement.pdf"],
  ["FDI reporting", "FDI-DEMO-0001", "30 Nov 2026", "northwind.firms", "demo-pass-f1", "Proof pending"],
];

export const DIRECTORS = ["Rohan Kumar", "Meera Iyer", "Neha Kapoor", "David Clarke"];

const KYC: string[][] = [
  ["DIN", "01234567", "01234568", "01234569", "01234570"],
  ["Full name", "Rohan Kumar", "Meera Iyer", "Neha Kapoor", "David James Clarke"],
  ["First name", "Rohan", "Meera", "Neha", "David"],
  ["Middle name", "", "", "", "James"],
  ["Last name", "Kumar", "Iyer", "Kapoor", "Clarke"],
  ["Date of birth", "12 Apr 1984", "3 Sep 1987", "21 Jan 1990", "8 Jul 1979"],
  ["Father name", "Suresh Kumar", "Venkat Iyer", "Rajiv Kapoor", "Peter John Clarke"],
  ["Father · first name", "Suresh", "Venkat", "Rajiv", "Peter"],
  ["Father · middle name", "", "", "", "John"],
  ["Father · last name", "Kumar", "Iyer", "Kapoor", "Clarke"],
  ["Address", "Flat 4B, Demo Residency, 12 Sample Road, Indiranagar, Bengaluru 560038", "No. 7, Demo Lane, Jayanagar 4th Block, Bengaluru 560011", "B-202, Sample Apartments, Sector 21, Gurugram 122001", "Flat 2, 10 Sample Street, London SE1 0AA, United Kingdom"],
  ["Mobile number", "+91 98000 00001", "+91 98000 00002", "+91 98000 00003", "+91 98000 00004"],
  ["Mail ID", "rohan.kumar@northwind-demo.in", "meera.iyer@northwind-demo.in", "neha.kapoor@northwind-demo.in", "david.clarke@northwind-demo.in"],
  ["Passport", "Z0000001", "Z0000002", "Z0000003", "000000004"],
  ["Aadhaar no", "0000 0000 0001", "0000 0000 0002", "0000 0000 0003", ""],
  ["Driving licence", "KA00 20100000001", "KA00 20120000002", "HR00 20150000003", ""],
  ["PAN", "ABCDE1234F", "ABCDE1235F", "ABCDE1236F", "ABCDE1237F"],
  ["Address proof", "Aadhaar card", "Passport", "Electricity bill · Mar 2026", "Bank statement · Feb 2026"],
  ["Education", "MBA", "B.Tech", "Chartered Accountant", "MSc"],
  ["Category", "Resident Indian", "Resident Indian", "Resident Indian", "Foreign national"],
  ["Duration of stay", "6 years", "4 years", "3 years", "2 years"],
  ["Place of birth", "Bengaluru", "Chennai", "New Delhi", "Manchester"],
  ["Director role", "Managing Director", "Director", "Director", "Nominee Director"],
  ["Aadhaar-linked mobile", "+91 98000 00001", "+91 98000 00002", "+91 98000 00003", ""],
];

const OTHER: string[][] = [
  ["Google Workspace admin", "admin@northwind-demo.in", "demo-pass-o1", "admin@northwind-demo.in", "Super admin"],
  ["Office Wi-Fi admin", "NWT-WIFI-ADMIN", "demo-pass-o2", "it@northwind-demo.in", "Router at reception"],
  ["Accounting software", "NWT-BOOKS-01", "demo-pass-o3", "finance@northwind-demo.in", ""],
  ["Tally licence", "TALLY-DEMO-0001", "demo-pass-o4", "finance@northwind-demo.in", "Renews Mar 2027"],
  ["Cloud root account", "root@northwind-demo.in", "demo-pass-o5", "it@northwind-demo.in", "MFA on"],
  ["Domain registrar", "NWT-DOMAIN-01", "demo-pass-o6", "it@northwind-demo.in", ""],
  ["Team chat admin", "admin@northwind-demo.in", "demo-pass-o7", "it@northwind-demo.in", ""],
  ["Courier account", "NWT-COURIER-01", "demo-pass-o8", "office@northwind-demo.in", ""],
  ["Office alarm code", "Panel A", "000000", "office@northwind-demo.in", "Change after staff exits"],
  ["Payroll software", "NWT-PAYROLL-01", "demo-pass-o9", "hr@northwind-demo.in", ""],
  ["Bank token (backup)", "Token 09", "0009", "finance@northwind-demo.in", "Kept in the safe"],
  ["Website CMS", "webadmin", "demo-pass-o10", "it@northwind-demo.in", ""],
];

/** The five sheets. Before COI, company IDs read "Pending COI" and registrations "Not registered yet". */
export function sheetsFor(after: boolean): Sheet[] {
  const loginAuto: Record<string, string> = {};
  const loginRows: string[][] = [];
  LOGINS.forEach((x, r) => {
    if (!x) {
      loginRows.push(["", "", "", "", "", "", ""]);
      return;
    }
    const knownBefore = x[2] === "profile" || x[2] === "office";
    const id = after || knownBefore ? x[1] : x[2] === "coi" ? "Pending COI" : "";
    if (id && id !== "Pending COI" && x[2]) loginAuto[`${r}|2`] = x[2];
    loginAuto[`${r}|4`] = "profile";
    loginAuto[`${r}|5`] = "profile";
    loginRows.push(["", x[0], id, after || x[0] === "Mail ID · company" ? x[3] : "", CO_MAIL, CO_MOBILE, after ? x[4] : x[5]]);
  });
  const regAuto: Record<string, string> = {};
  [0, 1, 2, 3, 7, 8].forEach((r) => (regAuto[`${r}|2`] = "reg"));
  const addrAuto: Record<string, string> = {};
  for (let c = 1; c <= 10; c++) {
    addrAuto[`0|${c}`] = "office";
    addrAuto[`2|${c}`] = "office";
  }
  const kycAuto: Record<string, string> = {};
  [0, 1, 2, 3, 4, 5, 10, 11, 12, 16].forEach((r) => {
    for (let c = 1; c <= 4; c++) kycAuto[`${r}|${c}`] = "inc";
  });
  return [
    {
      id: "address",
      label: "Address",
      lab: 0,
      auto: addrAuto,
      cols: ["Address type", "Door no", "Building", "Street", "Area", "Landmark", "City", "District", "State", "PIN", "Country", "Phone", "Email", "Latitude, longitude", "Ownership", "Owner name"].map((n): SheetCol => ({ name: n, mono: n === "PIN" || n === "Latitude, longitude" })).concat([
        { name: "NOC", kind: "cert" },
        { name: "Utility bill", kind: "cert" },
        { name: "Rent agreement", kind: "cert" },
      ]),
      rows: ADDR_ROWS.map((r) => [...r]),
    },
    {
      id: "login",
      label: "Login credentials",
      lab: 1,
      add: "row",
      auto: loginAuto,
      cols: [{ name: "S.No", kind: "sno" }, { name: "Registration" }, { name: "ID", secret: true, mono: true }, { name: "Password", secret: true, mono: true }, { name: "Mail" }, { name: "Mobile", secret: true, mono: true }, { name: "Status", kind: "status" }],
      rows: loginRows,
    },
    {
      id: "reg",
      label: "Registrations",
      lab: 1,
      auto: after ? regAuto : {},
      cols: [{ name: "S.No", kind: "sno" }, { name: "Registration" }, { name: "Number", mono: true }, { name: "Date of registration" }, { name: "Login ID", secret: true, mono: true }, { name: "Password", secret: true, mono: true }, { name: "Certificate", kind: "cert" }],
      rows: after ? REGS.map((r) => ["", ...r]) : REGS.map((r, i) => ["", r[0], "Not registered yet", "", "", "", i % 3 === 0 ? "Proof pending" : ""]),
    },
    {
      id: "kyc",
      label: "Directors KYC",
      lab: 0,
      add: "director",
      auto: kycAuto,
      secretRows: [5, 13, 14, 15, 16, 17, 23],
      cols: [{ name: "Particulars" }, ...DIRECTORS.map((n) => ({ name: n }))],
      rows: KYC.map((r) => [...r]),
    },
    {
      id: "other",
      label: "Other credentials",
      lab: 0,
      add: "row",
      cols: [{ name: "Item" }, { name: "ID", secret: true, mono: true }, { name: "Password", secret: true, mono: true }, { name: "Linked email" }, { name: "Notes" }],
      // Before COI the sheet is empty, as in the old screen.
      rows: after ? OTHER.map((r) => [...r]) : [],
    },
  ];
}

export interface AccessEntry {
  at: Date;
  text: string;
}

export const ACCESS_LOG: AccessEntry[] = [
  { at: new Date(2026, 9, 10, 16, 12), text: "Pranay edited Address · Corporate office · Street" },
  { at: new Date(2026, 9, 11, 9, 3), text: "Bharath started Preview · Registrations · OTP approved by Pranay" },
  { at: new Date(2026, 9, 11, 11, 40), text: "Rohan Kumar revealed Rohan Kumar · PAN · OTP approved by Pranay" },
];
