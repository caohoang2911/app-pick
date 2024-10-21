import { useEffect, useState } from "react";
import * as Linking from "expo-linking";
import { router } from "expo-router";

const useHandleDeepLink = () => {
  const [data, setData] = useState(null);

  function handleDeepLink(event: any) {
    let data: any = Linking.parse(event.url);
    const { queryParams, path } = data || {};
    const { orderCode } = queryParams || {};

    if(path.includes('order-detail') && orderCode) {
      router.replace(`orders/order-detail/${orderCode}`)
    } else if(path.includes('order-invoice') && orderCode) {
      router.replace(`orders/order-invoice/${orderCode}`)  
    } else {
      router.navigate('orders')
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
