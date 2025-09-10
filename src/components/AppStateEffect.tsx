import { ReactNode, useEffect, useState } from "react";
import { AppState } from "react-native";
import { useAuth } from "../core";
import { isTimestampExpired } from "../core/utils/moment";
import { signOut } from "../core";

interface Props {
  children: ReactNode;
}

export const AppStateEffect = () => {
  const [appState, setAppState] = useState(AppState.currentState);
  const { expired } = useAuth.use.userInfo();

  const isExpired = expired && isTimestampExpired(expired);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {  
      // Check for the current state of the app  
      if (appState.match(/inactive|background/) && nextAppState === 'active') {  
        if(isExpired) {
          signOut();
        }
      }  
      setAppState(nextAppState);  
    });  

    // Cleanup the subscription on unmount  
    return () => {  
      subscription.remove();  
    };  
  }, [appState, isExpired]);  
  
  return null;
};