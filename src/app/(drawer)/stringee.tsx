import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useStringeeStore } from '~/src/core/store/stringee';
import { showMessage } from 'react-native-flash-message';

const { width, height } = Dimensions.get('window');

export default function StringeeInCall() {
  const [callDuration, setCallDuration] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const {
    callState: { isInCall, callStatus, phoneNumber, isAudioEnabled, isCallAnswered, isCallEnded, signalingCode, mediaCode, customerName },
    endCall,
    toggleAudio,
  } = useStringeeStore();
  


  // Start countdown timer when call is actually answered (signalingCode === 2)
  useEffect(() => {
    // Only start countdown when call is actually answered
    const shouldStartCountdown = isCallAnswered;

    if (shouldStartCountdown) {
      if (!intervalRef.current) {
        setCallDuration(0);
        intervalRef.current = setInterval(() => {
          setCallDuration(prev => prev + 1);
        }, 1000);
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (!isInCall) {
        setCallDuration(0);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isInCall, isCallAnswered]);

  useEffect(() => {
    if (isCallEnded) {
      router.back();
      showMessage({
        type: 'danger',
        message: 'Cuộc gọi đã kết thúc',
      });
    }
  }, [isCallEnded]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Debug: Log current state
  console.log('🔍 StringeeInCall Debug:', {
    isInCall,
    callStatus,
    phoneNumber,
    isAudioEnabled,
    callDuration
  });

  if (!isInCall) {
    return (
      <View style={styles.container}>
        <Text style={styles.statusText}>Không có cuộc gọi nào đang diễn ra</Text>
        <Text style={styles.debugText}>Debug: isInCall = {String(isInCall)}</Text>
        <Text style={styles.debugText}>Debug: callStatus = {callStatus}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* Call Info */}
      <View style={styles.callInfoSection}>
        <Text style={styles.callerName}>{customerName}</Text>
        {isCallAnswered && (
          <Text style={styles.callDuration}>
            {formatTime(callDuration)}
          </Text>
        )}
        <Text style={styles.callerName}>{phoneNumber}</Text>
        {/* {callStatus && !isCallAnswered && (
          <Text style={styles.callStatusText}>{callStatus}</Text>
        )}
        

        <Text style={styles.debugText}>Debug: isInCall = {String(isInCall)}</Text>
        <Text style={styles.debugText}>Debug: callStatus = {callStatus}</Text>
        <Text style={styles.debugText}>Debug: isAudioEnabled = {String(isAudioEnabled)}</Text>
        <Text style={styles.debugText}>Debug: isCallAnswered = {String(isCallAnswered)}</Text>
        <Text style={styles.debugText}>Debug: signalingCode = {signalingCode}</Text>
        <Text style={styles.debugText}>Debug: mediaCode = {mediaCode}</Text> */}
      </View>

      {/* Call Controls */}
      <View style={styles.callControls}>
        <View style={styles.controlRow}>
          {/* Mute Button */}
          <TouchableOpacity 
            style={[
              styles.controlButton, 
              isAudioEnabled ? styles.inactiveButton : styles.activeButton
            ]} 
            onPress={toggleAudio}
          >
            <MaterialIcons 
              name={isAudioEnabled ? 'mic' : 'mic-off'} 
              size={28} 
              color={isAudioEnabled ? "#fff" : "#000"} 
            />
            <Text style={[
              styles.controlLabel,
              isAudioEnabled ? styles.inactiveLabel : styles.activeLabel
            ]}>
              Mute
            </Text>
          </TouchableOpacity>

          {/* End Call Button */}
          <TouchableOpacity 
            style={[styles.controlButton, styles.endCallButton]} 
            onPress={endCall}
          >
            <MaterialIcons name="call-end" size={28} color="#fff" />
            <Text style={styles.endCallLabel}>End</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Gesture Bar */}
      <View style={styles.gestureBar} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  callInfoSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  callDuration: {
    color: '#999',
    fontSize: 18,
    marginBottom: 10,
  },
  callerName: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  callStatusText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  callControls: {
    paddingHorizontal: 40,
    paddingBottom: 50,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    marginHorizontal: 20,
  },
  inactiveButton: {
    backgroundColor: '#333',
  },
  activeButton: {
    backgroundColor: '#fff',
  },
  endCallButton: {
    backgroundColor: '#FF3B30',
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  inactiveLabel: {
    color: '#fff',
  },
  activeLabel: {
    color: '#000',
  },
  endCallLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  gestureBar: {
    width: 134,
    height: 5,
    backgroundColor: '#fff',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 20,
  },
  debugText: {
    color: '#FF6B35',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  },
});
