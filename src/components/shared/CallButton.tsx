import Feather from '@expo/vector-icons/Feather';
import { LinearGradient } from 'expo-linear-gradient';
import { router, usePathname } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, PermissionsAndroid, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import {
  StringeeCall,
  StringeeClient,
  StringeeClientListener,
} from 'stringee-react-native-v2';
import { useStringeeStore } from '~/src/core/store/stringee';
import { formatPhoneTo84, isValidPhoneNumber } from '~/src/core/utils/phone';

const TOKEN = 'eyJjdHkiOiJzdHJpbmdlZS1hcGk7dj0xIiwidHlwIjoiSldUIiwiYWxnIjoiSFMyNTYifQ.eyJqdGkiOiJTSy4wLm02NlJlTWdDVnlzYWpyVWY4QkJXNTh4QkRrNDlCM0ItMTc1MjkzODU5MyIsImlzcyI6IlNLLjAubTY2UmVNZ0NWeXNhanJVZjhCQlc1OHhCRGs0OUIzQiIsImV4cCI6MTc1NTUzMDU5MywidXNlcklkIjoic2VlZGNvbSIsImljY19hcGkiOnRydWV9.gA8Uk08SU9ZmOyq36y-Zn_CCUHAl1AoQ0wYednNTejk'

interface CallButtonProps {
  phoneNumber: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  onCallStart?: () => void;
  onCallEnd?: () => void;
  onError?: (error: string) => void;
  className?: string;
  name?: string;
}

const CallButton: React.FC<CallButtonProps> = ({
  phoneNumber,
  size = 'medium',
  name: customerName = '',
  disabled = false,
  onCallStart,
  onCallEnd,
  onError,
  className,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const pathname = usePathname();

  const stringeeClientRef = useRef<StringeeClient | null>(null);
  const listenerRef = useRef<any>(null);
  const callRef = useRef<any | null>(null);

  
  const { startCall, endCall, updateCallStatus, updateSignalingCode, updateMediaCode, setCallRef } = useStringeeStore();

  // Initialize Stringee client
  useEffect(() => {
    const initializeStringee = async () => {
      await requestPermissions();
      
      // Configure audio session for iOS
      if (Platform.OS === 'ios') {
        try {
          const { Audio } = require('expo-av');
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
          });
        } catch (err) {
          console.warn('Audio session configuration error:', err);
        }
      }

      const client = new StringeeClient();
      stringeeClientRef.current = client;

      listenerRef.current = new StringeeClientListener();
      listenerRef.current.onConnect = (client, userId) => {
        console.log('✅ Connected to Stringee:', userId);
        setIsConnected(true);
        setIsConnecting(false);
      };
      listenerRef.current.onDisConnect = () => {
        console.log('🔌 Disconnected from Stringee');
        setIsConnected(false);
        setIsConnecting(false);
        endCall();
      };
      listenerRef.current.onFailWithError = (client, code, message) => {
        console.log('❌ Stringee connection failed:', code, message);
        setIsConnected(false);
        setIsConnecting(false);
        const errorMsg = 'Kết nối Stringee thất bại: ' + message;
        onError?.(errorMsg);
      };
      listenerRef.current.onRequestAccessToken = () => {
        console.log('🔄 Token expired, need to refresh');
        setIsConnected(false);
        const errorMsg = 'Token đã hết hạn, vui lòng thử lại';
        onError?.(errorMsg);
      };

      client.setListener(listenerRef.current);

      console.log('🔄 Connecting to Stringee...');
      setIsConnecting(true);
      client.connect(TOKEN);
    };

    initializeStringee();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.CAMERA,
        ];

        const results = await PermissionsAndroid.requestMultiple(permissions);
        const allGranted = Object.values(results).every(
          result => result === PermissionsAndroid.RESULTS.GRANTED
        );

        if (!allGranted) {
          Alert.alert('Quyền truy cập', 'Ứng dụng cần quyền microphone và camera.', [{ text: 'OK' }]);
        }
      } catch (err) {
        console.warn('Permission request error:', err);
      }
    } else if (Platform.OS === 'ios') {
      try {
        const { Audio } = require('expo-av');
        const { Camera } = require('expo-camera');
        
        const audioPermission = await Audio.requestPermissionsAsync();
        const cameraPermission = await Camera.requestCameraPermissionsAsync();
        
        if (audioPermission.status !== 'granted' || cameraPermission.status !== 'granted') {
          Alert.alert('Quyền truy cập', 'Ứng dụng cần quyền microphone và camera để thực hiện cuộc gọi.', [{ text: 'OK' }]);
        }
      } catch (err) {
        console.warn('iOS Permission request error:', err);
      }
    }
  };



  const makeCall = async () => {
    if (!stringeeClientRef.current) {
      const errorMsg = 'Client chưa kết nối';
      onError?.(errorMsg);
      // Only back if currently on stringee screen
      return;
    }

    if (!phoneNumber || phoneNumber.trim() === '') {
      const errorMsg = 'Vui lòng nhập số điện thoại';
      onError?.(errorMsg);
      // Only back if currently on stringee screen
     
      return;
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      const errorMsg = 'Số điện thoại không hợp lệ';
      onError?.(errorMsg);
      // Only back if currently on stringee screen
     
      return;
    }

    try {
      const formattedNumber = formatPhoneTo84(phoneNumber);

      console.log('📞 Attempting to call:', formattedNumber);

      const call = new StringeeCall({
        stringeeClient: stringeeClientRef.current,
        from: '842471010529',
        to: formattedNumber,
        customData: JSON.stringify({ customData: 'customData' }),
      });
      
      call.isVideoCall = false;
      // call.icc_api = true;

      
      // Add event listeners
      listenerRef.current.onChangeSignalingState = (call: any, signalingState: any, reason: any, sipCode: any, sipReason: any) => {
        console.log('📞 SignalingStateChange:', signalingState);
        
        // Các trạng thái code quan trọng:
        // 0: Calling
        // 1: Ringing  
        // 2: Answered  <-- ✅ TRẠNG THÁI BẮT MÁY
        // 3: Busy
        // 4: Ended
        
        updateSignalingCode(signalingState);

   
        
        if (signalingState === 2) {
          console.log('✅ Call has been answered');
        }
      };

      listenerRef.current.onChangeMediaState = (call: any, mediaState: any) => {
        console.log('🎙️ MediaStateChange:', mediaState, "onChangeMediaState");
        // code === 0: Disconnected
        // code === 1: Connected
        updateMediaCode(mediaState);
        
        if (mediaState === 1) {
          console.log('✅ Media is connected (audio/video flowing)');
        }
      };

      listenerRef.current.onReceiveLocalStream = (call: any) => {
        console.log('📞 Local stream ready', "onReceiveLocalStream");
        updateCallStatus('Local stream ready');
      };

      listenerRef.current.onReceiveRemoteStream = (call: any) => {
        console.log('📞 Remote stream ready', "onReceiveRemoteStream");
        updateCallStatus('Remote stream ready');
      };

      listenerRef.current.onReceiveCallInfo = (call: any, callInfo: any) => {
        console.log('📞 Call info:', callInfo);
        console.log('onReceiveCallInfo');
        updateCallStatus('Call connected');
      };

      listenerRef.current.onReceiveCallInfo = (call: any) => {
        console.log('📞 Call onReceiveCallInfo');
        updateCallStatus('Call ended');
        endCall();
        onCallEnd?.();
      };

      listenerRef.current.onHandleOnAnotherDevice = (call: any) => {
        console.log('📞 Call onHandleOnAnotherDevice');
        updateCallStatus('Call ended');
        endCall();
        onCallEnd?.();
      };

      listenerRef.current.onAudioDeviceChange = (call: any) => {
        console.log('📞 Call onAudioDeviceChange');
        updateCallStatus('Call ended');
        endCall();
        onCallEnd?.();
      };

      call.setListener(listenerRef.current);

      const callId = await call.makeCall();
      // Push router to /stringee immediately after starting the call
      router.push('/stringee');

      startCall(formattedNumber, customerName || '', callId);
      callRef.current = call;
      setCallRef(call); // Store callRef for use in stringee.tsx
      updateCallStatus('Calling...');
      
    } catch (err: any) {
      console.error('❌ Call error:', err);
      const errorMessage = err?.message || err?.toString() || 'Unknown error';
      const errorMsg = 'Lỗi gọi: ' + errorMessage;
      onError?.(errorMsg);
      updateCallStatus('Call failed');
      // Only back if currently on stringee screen
     
    }
  };

  const hangUp = async () => {
    if (callRef.current) {
      try {
        console.log('📴 Ending call...');
        await callRef.current.hangup();
        console.log('📴 Call ended successfully');
        endCall();
        onCallEnd?.();
      } catch (error) {
        console.error('❌ Hang up error:', error);
        endCall();
        onCallEnd?.();
      }
    } else {
      console.log('📴 No active call to hang up');
      endCall();
      onCallEnd?.();
    }
  };

  const handlePress = () => {
    const { callState } = useStringeeStore.getState();
    if (callState.isInCall) {
      hangUp();
    } else {
      makeCall();
    }
    onCallStart?.();
  };

  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return { width: 40, height: 40, borderRadius: 20 };
      case 'large':
        return { width: 60, height: 60, borderRadius: 30 };
      default:
        return { width: 50, height: 50, borderRadius: 25 };
    }
  };

  const getGradientColors = () => {
    return ['#4CAF50', '#45a049'];
  }


  const isButtonDisabled = disabled || !isConnected || isConnecting;

  return (
    <TouchableOpacity
      style={[styles.button, getButtonSize()]}
      onPress={handlePress}
      disabled={isButtonDisabled}
      className={className}
    >
      <LinearGradient
        colors={getGradientColors()}
        style={[styles.gradient, getButtonSize()]}
      >
        <Feather name="phone-call" size={16} color="white" />
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    overflow: 'hidden',
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CallButton; 