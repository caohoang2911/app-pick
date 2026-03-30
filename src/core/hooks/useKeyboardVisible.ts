import { useState, useEffect } from 'react';
import { Keyboard, Platform } from 'react-native';

export const useKeyboardVisible = () => {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscriptions = [
      Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true)),
    ];
    const hideSubscriptions = [
      Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false)),
    ];

    if (Platform.OS === 'ios') {
      showSubscriptions.push(
        Keyboard.addListener('keyboardWillShow', () =>
          setKeyboardVisible(true),
        ),
      );
      hideSubscriptions.push(
        Keyboard.addListener('keyboardWillHide', () =>
          setKeyboardVisible(false),
        ),
      );
    }

    return () => {
      hideSubscriptions.forEach((subscription) => subscription.remove());
      showSubscriptions.forEach((subscription) => subscription.remove());
    };
  }, []);

  return isKeyboardVisible;
};
