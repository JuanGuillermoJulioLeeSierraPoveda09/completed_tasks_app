import React from 'react';
import { type SharedValue } from 'react-native-reanimated';

export const CARD_GAP = 10;
export const CARD_FALLBACK_HEIGHT = 83;

export type CardInfo = { g: string; i: number; h: number };
export type InfoMap = Record<string, CardInfo>;

export interface DragContext {
  info: SharedValue<InfoMap>;
  dragId: SharedValue<string>;
  dragTo: SharedValue<number>;
  committing: SharedValue<boolean>;
}

export const hOf = (info: InfoMap, k: string): number => {
  'worklet';
  const h = info[k].h;
  return h > 0 ? h : CARD_FALLBACK_HEIGHT;
};

export const groupIdsSorted = (info: InfoMap, g: string): string[] => {
  'worklet';
  const ids: string[] = [];
  for (const k in info) {
    if (info[k].g === g) ids.push(k);
  }
  ids.sort((a, b) => info[a].i - info[b].i);
  return ids;
};

export const virtualOrder = (info: InfoMap, g: string, dragId: string, to: number): string[] => {
  'worklet';
  const ids = groupIdsSorted(info, g);
  const from = dragId ? ids.indexOf(dragId) : -1;
  if (from === -1) return ids;
  ids.splice(from, 1);
  ids.splice(Math.max(0, Math.min(to, ids.length)), 0, dragId);
  return ids;
};

export const topOf = (info: InfoMap, ids: string[], id: string): number => {
  'worklet';
  let y = 0;
  for (let n = 0; n < ids.length; n++) {
    if (ids[n] === id) return y;
    y += hOf(info, ids[n]) + CARD_GAP;
  }
  return y;
};

export const stackHeight = (info: InfoMap, ids: string[]): number => {
  'worklet';
  let y = 0;
  for (let n = 0; n < ids.length; n++) {
    y += hOf(info, ids[n]) + CARD_GAP;
  }
  return Math.max(0, y - CARD_GAP);
};

export const dropIndex = (info: InfoMap, g: string, id: string, centerY: number): number => {
  'worklet';
  const others = groupIdsSorted(info, g).filter((k) => k !== id);
  const H = hOf(info, id);
  let best = 0;
  let bestDist = Infinity;
  let y = 0;
  for (let t = 0; t <= others.length; t++) {
    const d = Math.abs(y + H / 2 - centerY);
    if (d < bestDist) {
      bestDist = d;
      best = t;
    }
    if (t < others.length) y += hOf(info, others[t]) + CARD_GAP;
  }
  return best;
};

export const GroupMeasureContext = React.createContext<(id: string, h: number) => void>(() => {});
