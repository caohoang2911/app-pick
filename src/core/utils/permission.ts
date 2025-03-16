import { View, Text, Button } from 'react-native';  
import * as Permissions from 'expo-permissions'

const checkLocalNetworkPermission = async () => {  
  // Checking permission for local network  
  const { status } = await Permissions.getAsync(Permissions.LOCAL_NETWORK);  

  if (status !== 'granted') {  
    // Request permission  
    const { status: newStatus } = await Permissions.askAsync(Permissions.LOCAL_NETWORK);  
    if (newStatus === 'granted') {  
      console.log('Local network access granted');  
    } else {  
      console.log('Local network access denied');  
    }  
  } else {  
    console.log('Local network access already granted');  
  }  
};  
