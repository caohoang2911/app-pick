import { useEffect } from "react";
import { queryClient } from "../api/shared";
import { signOut, useAuth } from "../core";
import { useAppState } from "../core/hooks/useAppState";
import { isTimestampExpired } from "../core/utils/moment";

export const AppStateEffect = () => {
  const appState = useAppState();
  const { expired } = useAuth.use.userInfo();

  const isExpired = expired && isTimestampExpired(expired);

  useEffect(() => {
    if (appState === 'active') {  
      queryClient.invalidateQueries({
        predicate: () => true
      });
      if(isExpired) {
        signOut();
      }
    }  
  }, [appState, isExpired]);  
  
  return null;
};