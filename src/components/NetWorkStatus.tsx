import React, { useEffect, useState } from 'react';  
import { View, Text, StyleSheet } from 'react-native';  
import * as Network from 'expo-network';  
import { queryClient } from '../api/shared';

const NetworkStatus = () => {  
  const [isConnected, setIsConnected] = useState(null);  

  useEffect(() => {  
    const checkNetworkStatus = async () => {  
      const networkState: any = await Network.getNetworkStateAsync(); 
      setIsConnected(networkState.isConnected); 

      if (isConnected === false && networkState.isConnected === true) {
        // ... reset query logic here ...
        queryClient.refetchQueries();
      }
    };  

    // Check the initial network status  
    checkNetworkStatus();  

    // Check network status every 5 seconds  
    const intervalId = setInterval(checkNetworkStatus, 5000);  

    // Cleanup function to clear the interval  
    return () => {  
      clearInterval(intervalId);  
    };  
  }, []);  

  if(isConnected) return null;

  return ( 
    <View style={styles.container}>
      <Text style={styles.text}>Mất kết nối mạng</Text>  
    </View>
  );  
};  

const styles = StyleSheet.create({  
  container: {  
    justifyContent: 'center',  
    alignItems: 'center',  
    backgroundColor: 'red'
  },  
  text: {  
    fontSize: 12, 
    textAlign: 'center',
    color: 'white'
  },  
});  

export default NetworkStatus;
