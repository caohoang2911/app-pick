import { useEffect, useState } from "react";
import * as Linking from "expo-linking";
import { router } from "expo-router";

const useHandleDeepLink = () => {
  const [data, setData] = useState(null);

  function handleDeepLink(event: any) {
    let data: any = Linking.parse(event.url);
    console.log('deep link', data)
    const { queryParams, path } = data || {};
    const { orderCode } = queryParams || {};
    console.log('path', path)
    console.log('orderCode', orderCode)
    if(path === 'orders' && orderCode) {
      router.navigate(`orders/${orderCode}`)
    } else if(path === 'orders'){
      router.replace('orders')
    }
  }
    
    useEffect(() => {
      const subscription = Linking.addEventListener("url", handleDeepLink);
      return () => {
        subscription.remove();
      };
    }, []);

    return { data };
    
};

export default useHandleDeepLink;
