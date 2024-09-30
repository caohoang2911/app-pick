import messaging from '@react-native-firebase/messaging';

const registerForPushNotificationsAsync = async () => {
  let token;
  const authStatus = await messaging().requestPermission();

  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  
  if (enabled) {
    token = await messaging().getToken();
    console.log(token, "TOKEN");
  };

  return token;
};


export { registerForPushNotificationsAsync };
