import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import { Text, TextInput, TextStyle, View, ViewStyle } from 'react-native';

export type CountdownTimerSize = 'sm' | 'md' | 'lg' | 'default';

interface CountdownTimerProps {
  initialMilliseconds?: number;
  onComplete?: () => void;
  containerStyle?: ViewStyle;
  textStyle?: TextStyle;
  inputStyle?: TextStyle;
  showInput?: boolean;
  autoStart?: boolean;
  size?: CountdownTimerSize;
}

export interface CountdownTimerRef {
  start: () => void;
  stop: () => void;
  reset: (newMs?: number) => void;
  getRemainingMs: () => number;
}

const CountdownTimer = forwardRef<CountdownTimerRef, CountdownTimerProps>(
  (
    {
      initialMilliseconds = 0,
      onComplete,
      containerStyle,
      textStyle,
      inputStyle,
      showInput = false,
      autoStart = false,
      size = 'default',
    },
    ref
  ) => {
    const [remainingMs, setRemainingMs] = useState(initialMilliseconds);
    const [isRunning, setIsRunning] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const expectedEndTimeRef = useRef<number | null>(null);
    const hasAutoStartedRef = useRef<boolean>(false);

    // Get font size based on size prop
    const getFontSize = (): number => {
      switch (size) {
        case 'sm':
          return 14;
        case 'md':
          return 15;
        case 'lg':
          return 17;
        case 'default':
        default:
          return 13;
      }
    };

    // Format milliseconds to mm:ss
    const formatTime = (milliseconds: number): string => {
      const totalSeconds = Math.floor(milliseconds / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
        2,
        '0'
      )}`;
    };

    // Start countdown
    const start = () => {
      if (remainingMs > 0 && !isRunning) {
        setIsRunning(true);
        expectedEndTimeRef.current = Date.now() + remainingMs;
      }
    };

    // Stop countdown
    const stop = () => {
      setIsRunning(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    // Reset countdown
    const reset = (newMs?: number) => {
      stop();
      const value = newMs !== undefined ? newMs : initialMilliseconds;
      setRemainingMs(value);
      expectedEndTimeRef.current = null;
      hasAutoStartedRef.current = false;
    };

    // Get remaining milliseconds
    const getRemainingMs = () => remainingMs;

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      start,
      stop,
      reset,
      getRemainingMs,
    }));

    // Handle input change
    const handleInputChange = (text: string) => {
      setInputValue(text);
      // Parse mm:ss format or plain number
      const mmssMatch = text.match(/^(\d{1,2}):(\d{1,2})$/);
      if (mmssMatch) {
        const minutes = parseInt(mmssMatch[1], 10);
        const seconds = parseInt(mmssMatch[2], 10);
        if (minutes >= 0 && seconds >= 0 && seconds < 60) {
          const newMs = (minutes * 60 + seconds) * 1000;
          setRemainingMs(newMs);
          if (isRunning) {
            expectedEndTimeRef.current = Date.now() + newMs;
          }
        }
      } else {
        const num = parseInt(text, 10);
        if (!isNaN(num) && num >= 0) {
          setRemainingMs(num);
          if (isRunning) {
            expectedEndTimeRef.current = Date.now() + num;
          }
        }
      }
    };

    // Countdown effect
    useEffect(() => {
      if (isRunning && remainingMs > 0) {
        intervalRef.current = setInterval(() => {
          const now = Date.now();
          const expectedEnd = expectedEndTimeRef.current;

          if (expectedEnd) {
            const elapsed = expectedEnd - now;

            if (elapsed <= 0) {
              setRemainingMs(0);
              setIsRunning(false);
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
              if (onComplete) {
                onComplete();
              }
            } else {
              setRemainingMs(elapsed);
            }
          }
        }, 100); // Update every 100ms for smooth countdown

        return () => {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        };
      } else if (remainingMs === 0 && isRunning) {
        setIsRunning(false);
        if (onComplete) {
          onComplete();
        }
      }
    }, [isRunning, remainingMs, onComplete]);

    // Initialize input value from initialMilliseconds
    useEffect(() => {
      if (initialMilliseconds > 0) {
        setRemainingMs(initialMilliseconds);
        const totalSeconds = Math.floor(initialMilliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        setInputValue(
          `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
            2,
            '0'
          )}`
        );
      }
    }, [initialMilliseconds]);

    // Auto start effect
    useEffect(() => {
      if (autoStart && initialMilliseconds > 0 && !hasAutoStartedRef.current) {
        hasAutoStartedRef.current = true;
        setIsRunning(true);
        expectedEndTimeRef.current = Date.now() + initialMilliseconds;
      }
    }, [autoStart, initialMilliseconds]);

    return (
      <View style={containerStyle}>
        {showInput && (
          <TextInput
            value={inputValue}
            onChangeText={handleInputChange}
            placeholder="mm:ss or milliseconds"
            keyboardType="numeric"
            style={[
              {
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 4,
                padding: 8,
                marginBottom: 8,
                textAlign: 'center',
              },
              inputStyle,
            ]}
          />
        )}
        <View className="flex flex-grow flex-row items-center justify-center bg-orange-500 px-2 py-2 rounded-md gap-1">
          <Text
            style={[
              {
                fontSize: getFontSize(),
                color: 'white',
                fontWeight: '500',
                textAlign: 'center',
              },
              textStyle,
            ]}
          >
           {remainingMs >= 0 ? <Text className="font-medium">Thời gian pick còn lại <Text className="font-bold">{formatTime(remainingMs)}</Text></Text> : <Text className="font-medium">Quá thời gian pick hàng</Text>}
          </Text>
        </View>
      </View>
    );
  }
);

CountdownTimer.displayName = 'CountdownTimer';

export default React.memo(CountdownTimer);
