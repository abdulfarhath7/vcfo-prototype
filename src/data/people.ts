export interface Person {
  id: string;
  name: string;
  role: string;
  org: "sbc" | "client";
  email: string;
  phone: string;
  /** Avatar initials differ from the name for a few people (BH for Bharath). */
  ini?: string;
}

export const SBC: Person[] = [
  { id: "pranay", name: "Pranay", role: "Manager", org: "sbc", email: "pranay@sbcllp.in", phone: "+91 98480 11223", ini: "PN" },
  { id: "bharath", name: "Bharath", role: "Project lead", org: "sbc", email: "bharath@sbcllp.in", phone: "+91 98480 33445", ini: "BH" },
  { id: "krishna", name: "Krishna", role: "Admin", org: "sbc", email: "krishna@sbcllp.in", phone: "+91 98480 55667", ini: "KR" },
  { id: "mithilesh", name: "Mithilesh", role: "Super admin", org: "sbc", email: "mithilesh@sbcllp.in", phone: "+91 98480 77889", ini: "MI" },
  { id: "farhath", name: "Farhath", role: "Developer", org: "sbc", email: "farhath@sbcllp.in", phone: "+91 98480 99001", ini: "FA" },
  { id: "support", name: "Customer support", role: "SBC help desk", org: "sbc", email: "help@sbcllp.in", phone: "+91 40 2345 6789", ini: "CS" },
];

export const CLIENT_PEOPLE: Person[] = [
  { id: "rohan", name: "Rohan Kumar", role: "Director · primary contact", org: "client", email: "rohan@northwind.in", phone: "+91 98111 22334", ini: "RK" },
  { id: "meera", name: "Meera Iyer", role: "Director", org: "client", email: "meera@northwind.in", phone: "+91 98111 55667", ini: "MI" },
  { id: "arjun", name: "Arjun Shah", role: "Finance", org: "client", email: "arjun@northwind.in", phone: "+91 98111 88990", ini: "AS" },
];

export interface Client {
  id: string;
  name: string;
  short: string;
  stage: "incorporating" | "compliance";
  /** Identity colour on staff screens (R-35). */
  tone: "accent" | "violet" | "teal" | "warn" | "ok" | "idle";
  lead: string;
  manager: string;
  cin?: string;
  pan?: string;
  gstin?: string;
}

export const NORTHWIND: Client = {
  id: "northwind",
  name: "Northwind Technologies India Pvt Ltd",
  short: "Northwind",
  stage: "incorporating",
  tone: "accent",
  lead: "Bharath",
  manager: "Pranay",
  pan: "AAHCN4821K",
};

export const CLIENTS: Client[] = [
  NORTHWIND,
  { id: "zenith", name: "Zenith Foods Pvt Ltd", short: "Zenith", stage: "compliance", tone: "teal", lead: "Bharath", manager: "Pranay", cin: "U15400TG2024PTC181920", pan: "AAFCZ1234R", gstin: "36AAFCZ1234R1ZK" },
  { id: "arcadia", name: "Arcadia Realty LLP", short: "Arcadia", stage: "compliance", tone: "violet", lead: "Bharath", manager: "Pranay", cin: "AAM-4521", pan: "AAJFA7788Q", gstin: "36AAJFA7788Q1Z2" },
  { id: "bluefin", name: "Bluefin Analytics Pvt Ltd", short: "Bluefin", stage: "incorporating", tone: "accent", lead: "Bharath", manager: "Pranay" },
  { id: "corvid", name: "Corvid Logistics Pvt Ltd", short: "Corvid", stage: "compliance", tone: "warn", lead: "Bharath", manager: "Pranay", cin: "U63000TG2023PTC170011", pan: "AAGCC4455L", gstin: "36AAGCC4455L1ZP" },
  { id: "delta", name: "Delta Edutech Pvt Ltd", short: "Delta", stage: "compliance", tone: "ok", lead: "Divya", manager: "Pranay", cin: "U80900TG2022PTC160202", pan: "AAECD9900M", gstin: "36AAECD9900M1Z4" },
  { id: "ember", name: "Ember Studios Pvt Ltd", short: "Ember", stage: "incorporating", tone: "violet", lead: "Divya", manager: "Pranay" },
  { id: "fjord", name: "Fjord Marine Exports Pvt Ltd", short: "Fjord", stage: "compliance", tone: "teal", lead: "Divya", manager: "Pranay", cin: "U05000TG2021PTC150303", pan: "AAFCF2211N", gstin: "36AAFCF2211N1Z9" },
];

export const WHATSAPP = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "")}`;
