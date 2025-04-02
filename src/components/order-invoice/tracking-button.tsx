import React, { useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import TrackingBottomSheet, { TrackingBottomSheetRef } from '../tracking/TrackingBottomSheet';
import Entypo from '@expo/vector-icons/Entypo';

interface TrackingButtonProps {
  trackingNumber?: string;
  trackingUrl?: string;
  carrierName?: string;
}

const TrackingButton: React.FC<TrackingButtonProps> = ({ trackingNumber, trackingUrl, carrierName }) => {
  const trackingBottomSheetRef = useRef<TrackingBottomSheetRef>(null);

  const handleOpenTracking = () => {
    if (!trackingUrl) {
      return;
    }
    
    trackingBottomSheetRef.current?.present(trackingUrl);
  };

  if (!trackingNumber || !trackingUrl) {
    return null;
  }

  return (
    <>
      <Pressable 
        className='flex-1 flex flex-row items-center gap-2 justify-between'
        onPress={handleOpenTracking}
      >
        <Text className='text-sm text-orange-500'>{trackingNumber || '--'}</Text>  
        <Entypo name="chevron-small-right" size={20} color="gray" />
      </Pressable>

      <TrackingBottomSheet 
        ref={trackingBottomSheetRef} 
        title={carrierName || 'Theo dõi đơn hàng'} 
      />
    </>
  );
};

export default TrackingButton; 