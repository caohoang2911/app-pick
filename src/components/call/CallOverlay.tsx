import React from 'react';

import { useCall } from '@/core/store/call';

import { IncomingCallScreen } from './IncomingCallScreen';
import { OngoingCallScreen } from './OngoingCallScreen';

/**
 * Lớp phủ cuộc gọi điều khiển bởi call store:
 * - `incoming` → màn hình cuộc gọi đến (trả lời / từ chối).
 * - `answered` → màn hình đang gọi (mic / loa / kết thúc).
 * Mount ở composition root (`_layout.tsx`).
 */
export function CallOverlay() {
  const status = useCall.use.status();

  if (status === 'incoming') return <IncomingCallScreen />;
  if (status === 'answered') return <OngoingCallScreen />;
  return null;
}
