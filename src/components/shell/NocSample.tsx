"use client";
import * as React from "react";
import type { BrStage, NocCase } from "@/data/board-resolution";

// Prototype state for the Board resolution (NOC) page: the sample case and the stage.
// The prototype bar sets it; every portal's page reads it. It lasts for the tab (sessionStorage).

export interface NocSampleState {
  noc: NocCase;
  /** Null: the role's own start stage. */
  stage: BrStage | null;
}

const KEY = "vcfo-noc-sample";
const START: NocSampleState = { noc: "foreign", stage: null };
let state: NocSampleState = START;
let loaded = false;
const subs = new Set<() => void>();

function load() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) state = { ...START, ...(JSON.parse(raw) as Partial<NocSampleState>) };
  } catch {
    /* storage blocked: start state */
  }
}

export function setNocSample(patch: Partial<NocSampleState>) {
  state = { ...state, ...patch };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage blocked: the state lasts for this page only */
  }
  subs.forEach((f) => f());
}

const subscribe = (f: () => void) => {
  subs.add(f);
  return () => subs.delete(f);
};

export function useNocSample(): NocSampleState {
  return React.useSyncExternalStore(
    subscribe,
    () => {
      load();
      return state;
    },
    () => START,
  );
}
