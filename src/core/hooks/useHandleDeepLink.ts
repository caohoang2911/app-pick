import { useEffect, useState } from "react";
import * as Linking from "expo-linking";
import { router, usePathname } from "expo-router";

const useHandleDeepLink = () => {
  const [data, setData] = useState(null);

  const pathname = usePathname();

  function handleDeepLink(event: any) {
    let data: any = Linking.parse(event.url);
    console.log('deep link', data)
    const { queryParams, path } = data || {};
    const { orderCode } = queryParams || {};
    console.log('path', path)
    console.log('orderCode', orderCode)

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
