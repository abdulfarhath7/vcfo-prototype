import { fmtYear } from "@/lib/dates";
import { obligation } from "@/data/compliance";
import { clientById } from "@/data/staff-clients";
import { staffRegistration } from "@/data/staff-compliance";
import { OLD_OB, OLD_REG, OLD_REG_WHY, type OldOb, type OldReg, type OldSide } from "@/data/staff-item-old";
import { REG_CLIENTS, regState, type RowState } from "@/data/staff-regs-table";

// The staff record page of a registration or an obligation, as in reference/old-screens/s/lead/Item.dc.html.
// The old page was one template for every client and item. The old default is Northwind · GST registration
// (key "northwind-gst") and Northwind · GSTR-1 (key "northwind-gstr1").
// Keys are "<client>-<item>". The item is an old regcat id (gst, gstr1, tdsp) or a compliance.ts id (tds-pay, pf-esi).

export type ItemKind = "reg" | "ob";

const FR: Record<string, string> = { m: "Monthly", q: "Quarterly", h: "Half-yearly", a: "Annual", e: "Event" };
const CODE: Record<string, string> = { northwind: "NT", orchid: "OL", larkspur: "LA", juniper: "JB", brightwave: "BR", tidewater: "TL", kestrel: "KH", halcyon: "HF" };
const GRID = ["gst", "lut", "epf", "esi", "pt", "se", "msme", "iec", "tm", "fcgpr"];

/** compliance.ts obligation ids that have an old regcat twin. */
const NEW_TO_OLD: Record<string, string> = { "tds-pay": "tdsp", "tds-24q": "tdsr", "tds-26q": "tdsr", "adv-tax": "adv", "pf-esi": "ecr", dir3kyc: "dir3" };
/** And back, for links to the obligations that a registration starts. */
const OLD_TO_NEW: Record<string, string> = { tdsp: "tds-pay", tdsr: "tds-24q", adv: "adv-tax", ecr: "pf-esi", esim: "pf-esi", dir3: "dir3kyc" };

const split = (key: string) => {
  const i = key.indexOf("-");
  return i < 0 ? null : { client: key.slice(0, i), item: key.slice(i + 1) };
};

export const clientNameOf = (id: string) => REG_CLIENTS.find((c) => c.id === id)?.name ?? clientById(id)?.name.replace(/ Pvt Ltd$/, "") ?? id;

/** An obligation from compliance.ts in the old shape, for ids the old data does not have (ITC-04, ECB-2, MGT-14). */
function fromNew(id: string): OldOb | undefined {
  const o = obligation(id);
  if (!o) return undefined;
  const fr = ({ Monthly: "m", Quarterly: "q", "Half-yearly": "h", Annual: "a", Event: "a" } as const)[o.frequency];
  // Upcoming steps without an owner and acknowledgements belong to the authority.
  const side = (title: string, state: string, owner?: string): OldSide => ((state !== "done" && !owner) || /Acknowledged|Approved|Accepted|Confirmed/.test(title) ? "a" : "s");
  return {
    id: o.id,
    name: o.name,
    law: o.law,
    fr,
    due: o.dueRule,
    next: fmtYear(o.due),
    last: o.lastFiled ? fmtYear(o.lastFiled) : "-",
    st: "none",
    by: o.startedBy ?? "",
    pen: o.penalty,
    from: o.needs,
    sbc: [[o.idLabel ?? "Reference", "-"]],
    steps: o.steps.map((s) => [side(s.title, s.state, s.owner), s.title]),
  };
}

const oldOb = (id: string) => OLD_OB.find((o) => o.id === id) ?? OLD_OB.find((o) => o.id === NEW_TO_OLD[id]) ?? fromNew(id);
const oldReg = (id: string) => OLD_REG.find((r) => r.id === id);

/** True when the key opens a record page. */
export function itemExists(kind: ItemKind, key: string) {
  const k = split(key);
  if (!k || !clientById(k.client)) return false;
  return kind === "reg" ? !!oldReg(k.item) : !!oldOb(k.item);
}

const STATUS_REG: Record<string, RowState> = { Granted: "done", "In progress": "run", "Waiting on client": "wait", "Not started": "none", "Not needed": "na" };

function regStateOf(client: string, id: string): RowState {
  if (CODE[client]) return GRID.includes(id) ? regState(client, id) : client === "northwind" ? "none" : "na";
  return STATUS_REG[staffRegistration(`${client}-${id}`)?.status ?? "Not needed"];
}

export interface ItemEvent {
  side: OldSide;
  title: string;
  sub: string;
  /** "24 Oct" or "Today". */
  date: string;
  weekday: string;
  next: boolean;
  late: boolean;
}

export interface ItemDocRow {
  title: string;
  sub: string;
  state: "ok" | "review" | "asked" | "notyet";
}

export interface ItemView {
  kind: ItemKind;
  key: string;
  client: string;
  clientName: string;
  clientShort: string;
  state: RowState;
  done: number;
  total: number;
  name: string;
  /** Form (registration) or law (obligation), with a tooltip. */
  form: string;
  formTip: string;
  /** Authority (registration) or frequency (obligation). */
  auth: string;
  team: string;
  facts: Array<{ k: string; v: string; tone?: "bad" | "ok" | "warn" | "prog" | "idle" }>;
  threadTitle: string;
  threadSub: string;
  authTitle: string;
  events: ItemEvent[];
  assist: string[];
  docs: ItemDocRow[];
  details: Array<[string, string]>;
  detailNote: string;
  sbc: Array<[string, string]>;
  past: Array<{ period: string; filed: string; ref: string; late: boolean }>;
  about: string;
  whyTitle: string;
  why: string;
  pen?: string;
  starts: Array<{ id: string; name: string; fr: string; key?: string }>;
  renTitle: string;
  ren: string;
  review: string[];
  reviewDone: number;
}

const REG_LABEL: Record<RowState, [string, ItemView["facts"][number]["tone"]]> = {
  done: ["Granted", "ok"],
  run: ["In progress", "prog"],
  wait: ["Waiting on client", "warn"],
  none: ["Not started", "idle"],
  na: ["Not needed", "idle"],
  bad: ["Overdue", "bad"],
};
const OB_LABEL: Record<RowState, [string, ItemView["facts"][number]["tone"]]> = { ...REG_LABEL, done: ["Filed", "ok"], none: ["Upcoming", "idle"] };

const FORMS: Record<string, string> = {
  "GST REG-01": "GST registration application, filed in two parts (A and B) on the GST portal.",
  "GST RFD-11": "Letter of undertaking to export without paying IGST.",
  "Form A": "Shops and Establishment registration form (Karnataka).",
  "TM-A": "Trademark application form.",
  "FC-GPR": "Foreign currency gross provisional return, filed on RBI FIRMS.",
};
const WD = ["Sat", "Mon", "Thu", "Sat", "Mon", "Tue", "Wed"];

/** The old Item.dc.html logic for the staff view. */
export function itemView(kind: ItemKind, key: string): ItemView | undefined {
  const k = split(key);
  if (!k || !itemExists(kind, key)) return undefined;
  const isOb = kind === "ob";
  const cname = clientNameOf(k.client);
  const cshort = cname.split(" ")[0];
  const code = CODE[k.client] ?? k.client.slice(0, 2).toUpperCase();
  const reg = isOb ? undefined : (oldReg(k.item) as OldReg);
  const ob = isOb ? (oldOb(k.item) as OldOb) : undefined;
  const steps = (reg ?? ob)!.steps;
  const total = steps.length;

  let st: RowState;
  let done: number;
  let dateV: string;
  let num = "";
  if (ob) {
    st = (["run", "wait", "done", "bad"] as const)[(code.charCodeAt(0) + ob.id.length) % 4];
    done = { done: total, run: 1, wait: 0, none: 0, bad: 1, na: 0 }[st];
    dateV = ob.next;
  } else {
    st = regStateOf(k.client, reg!.id);
    done = { done: total, run: 2, wait: 1, none: 0, na: 0, bad: 0 }[st];
    dateV = st === "done" ? "2 Oct 2026" : "Expected 30 Oct";
    num = st === "done" ? "On file" : "";
  }
  const [stLabel, stTone] = (isOb ? OB_LABEL : REG_LABEL)[st];
  const facts: ItemView["facts"] = [
    { k: isOb ? "Next due" : st === "done" ? "Granted" : "Expected", v: dateV, tone: st === "bad" ? "bad" : undefined },
    { k: isOb ? "Frequency" : "Number", v: isOb ? FR[ob!.fr] : num || "-" },
    { k: "Status", v: stLabel, tone: stTone },
  ];

  // The two-sided thread: the authority on the left, SBC on the right, dates on the spine.
  const base = isOb ? [1, 3, 6, 8, 10] : [24, 26, 26, 28, 30, 31];
  const mon = isOb ? "Nov" : "Oct";
  const dayLabel = (i: number): [string, string] => {
    const d = base[i] ?? base[base.length - 1] + i;
    return d > 31 ? [`${d - 31} Nov`, WD[i % 7]] : [`${d} ${mon}`, WD[i % 7]];
  };
  const auth = isOb ? `${ob!.law} portal` : reg!.auth;
  const events: ItemEvent[] = [];
  steps.forEach(([side, label], i) => {
    if (i > done) return;
    const isNext = i === done;
    if (isNext && st === "done") return;
    const [d, wd] = dayLabel(i);
    const au = side === "a";
    const title = isNext ? (st === "wait" ? `Waiting on ${cshort}` : `Next: ${label}`) : label;
    const sub = isNext ? (st === "wait" ? `Documents asked on ${d}` : `Expected ${d}`) : au ? (isOb ? auth : reg!.auth) : i === 0 ? "Checked by Bharath" : "Filed by Bharath";
    events.push({ side, title, sub, date: isNext ? "Today" : d, weekday: isNext ? "Fri" : wd, next: isNext, late: isNext && st === "wait" });
  });

  const docNames = isOb ? ob!.from : reg!.docs;
  const docs: ItemDocRow[] = docNames.map((t, i) => {
    const state: ItemDocRow["state"] = st === "done" || st === "run" || st === "bad" ? "ok" : st === "wait" ? (i < 2 ? "ok" : i === 2 ? "review" : "asked") : "notyet";
    const sub = state === "ok" ? `Uploaded by ${i % 3 === 2 ? "Bharath for the client" : cshort} · ${20 + i} Oct` : state === "review" ? "Uploaded today" : state === "asked" ? "Asked on 5 Nov · reminder on 9 Nov" : "SBC will ask when this starts";
    return { title: t, sub, state };
  });

  const sbc = (isOb ? ob!.sbc : reg!.sbc).map(([kk, v]): [string, string] => [kk, st === "done" || v === "-" ? v : st === "none" ? "-" : v]);
  const past = isOb
    ? [
        { period: "Sep 2026", filed: "11 Oct 2026", ref: "AA2910250913X", late: false },
        { period: "Aug 2026", filed: "10 Sep 2026", ref: "AA2909250811K", late: false },
        { period: "Jul 2026", filed: "14 Aug 2026", ref: "AA2908250722P", late: true },
      ]
    : [];
  const starts = isOb
    ? []
    : reg!.starts.flatMap((id) => {
        const o = OLD_OB.find((x) => x.id === id);
        if (!o) return [];
        const target = `${k.client}-${o.id}`;
        const alt = `${k.client}-${OLD_TO_NEW[o.id] ?? o.id}`;
        return [{ id: o.id, name: o.name, fr: FR[o.fr], key: itemExists("ob", target) ? target : itemExists("ob", alt) ? alt : undefined }];
      });
  const byReg = ob?.by ? OLD_REG.find((r) => r.id === ob.by) : undefined;
  const why = isOb
    ? byReg
      ? `Started when the ${byReg.name} was granted. Due ${ob!.due}.`
      : `Applies to every company. Due ${ob!.due}.`
    : st === "na"
      ? `Not needed for ${cname}: ${OLD_REG_WHY[reg!.id] || "set by the manager"}.`
      : `Applies to ${cname} because: ${OLD_REG_WHY[reg!.id] || reg!.rule}. Rule: ${reg!.rule}.`;

  return {
    kind,
    key,
    client: k.client,
    clientName: cname,
    clientShort: cshort,
    state: st,
    done,
    total,
    name: `${(reg ?? ob)!.name} · ${cname}`,
    form: isOb ? ob!.law : reg!.form,
    formTip: isOb ? "The law this filing comes from." : FORMS[reg!.form] ?? "The form SBC files for this registration.",
    auth: isOb ? FR[ob!.fr] : reg!.auth,
    team: isOb ? (byReg ? `Started by ${byReg.name}` : "Every company") : reg!.team,
    facts,
    threadTitle: isOb ? "This period" : "Steps",
    threadSub: isOb ? "October 2026" : `${done} of ${total} done`,
    authTitle: auth,
    events,
    assist: [`Sign in to the ${isOb ? ob!.law : reg!.auth} portal`, `Open ${isOb ? `${ob!.name} for October` : reg!.form}`, "Fill the details from VCFO", "Attach the accepted documents", "Submit and read back the reference"],
    docs,
    details: isOb ? [["Period", "October 2026"], ["Prepared from", "Tally export uploaded 3 Nov"]] : reg!.details,
    detailNote: `Confirmed by ${cshort} on 24 Oct`,
    sbc,
    past,
    about: isOb ? `${ob!.name} is filed ${FR[ob!.fr].toLowerCase()}: ${ob!.due}.` : reg!.about,
    whyTitle: isOb ? "Why it applies" : st === "na" ? "Not needed" : "Applies because",
    why,
    pen: isOb ? ob!.pen : undefined,
    starts,
    renTitle: isOb ? "Due rule" : "Renewal",
    ren: isOb ? ob!.due : reg!.renew + (reg!.renew !== "None" ? ". Reminders at 60, 30 and 7 days." : ""),
    review: isOb ? ["Figures match the books", "Prior period carried forward", "Client approved the summary", "Challan details checked"] : ["Entity type and state checked", "Every document accepted", "Details match the documents", "Manager approval if needed"],
    reviewDone: st === "done" ? 4 : done > 1 ? 2 : 0,
  };
}
