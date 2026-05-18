import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { getSkillLevel, setSkillLevel, type SkillLevel } from '@/services/farmerAgent';

/**
 * Read + write the agent's current skill level. Re-reads on screen focus so a change
 * in Settings propagates back to other screens without a full app reload.
 */
export function useSkillLevel(): [SkillLevel, (next: SkillLevel) => Promise<void>] {
  const [level, setLocal] = useState<SkillLevel>('novice');

  useEffect(() => {
    let cancelled = false;
    void getSkillLevel().then((v) => {
      if (!cancelled) setLocal(v);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      void getSkillLevel().then(setLocal);
    }, []),
  );

  const set = useCallback(async (next: SkillLevel) => {
    setLocal(next);
    await setSkillLevel(next);
  }, []);

  return [level, set];
}
