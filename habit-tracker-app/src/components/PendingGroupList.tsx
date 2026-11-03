import React, { useState, useLayoutEffect } from 'react';
import { View } from 'react-native';
import { runOnUI } from 'react-native-reanimated';
import { CARD_GAP, CARD_FALLBACK_HEIGHT, type InfoMap, type DragContext, GroupMeasureContext } from '../utils/dragLayout';

const PendingGroupList: React.FC<{
  groupKey: string;
  ids: string[];
  version: unknown;
  raised: boolean;
  drag: DragContext;
  onIdsChange?: (groupKey: string, ids: string[]) => void;
  children: React.ReactNode;
}> = ({ groupKey, ids, version, raised, drag, onIdsChange, children }) => {
  const { info, dragId, dragTo, committing } = drag;
  const [heights, setHeights] = useState<Record<string, number>>({});
  const idsKey = ids.join('|');
  const reportHeight = React.useCallback((id: string, h: number) => {
    setHeights((prev) => (prev[id] === h ? prev : { ...prev, [id]: h }));
  }, []);

  useLayoutEffect(() => {
    onIdsChange?.(groupKey, ids);
    runOnUI((g: string, list: string[]) => {
      'worklet';
      const prev = info.value;
      const next: InfoMap = {};
      for (const k in prev) {
        if (prev[k].g !== g) next[k] = prev[k];
      }
      for (let n = 0; n < list.length; n++) {
        const old = prev[list[n]];
        next[list[n]] = { g, i: n, h: old ? old.h : 0 };
      }
      info.value = next;
      const dId = dragId.value;
      if (committing.value && dId !== '' && next[dId] && next[dId].g === g) {
        committing.value = false;
        dragId.value = '';
        dragTo.value = -1;
      }
    })(groupKey, ids);
  }, [groupKey, idsKey, version]);

  const total = ids.reduce((sum, id) => sum + (heights[id] ?? CARD_FALLBACK_HEIGHT) + CARD_GAP, 0);

  return (
    <GroupMeasureContext.Provider value={reportHeight}>
      <View style={{ height: total, zIndex: raised ? 5 : 1 }}>{children}</View>
    </GroupMeasureContext.Provider>
  );
};

export default PendingGroupList;
