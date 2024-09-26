import { Drawer } from "expo-router/drawer"
import { DrawerContent } from "@/components/DrawerContent"
import { useEffect, useState } from "react";
import { useAuth } from "~/src/core";
import { setConfig, useConfig } from "~/src/core/store/config";
import { ConfigResponse, useGetConfig } from "~/src/api/config/useGetConfig";
import Loading from "~/src/components/Loading";
import { Stack } from "expo-router";


const ConfigWrapper = ({ children }: { children: React.ReactNode }) => {
  const [isDone, setIsDone] = useState(false)
  const status = useAuth.use.status();
  const version = useConfig.use.version();

  const { data, refetch, isFetching } = useGetConfig({ version });
  
  useEffect(() => { 
    if(status === 'signIn'){
      refetch();
    }
  }, [status]);

  useEffect(() => {
    if (data?.error) return;
    if (data?.data) {
      setConfig(data.data as ConfigResponse);
    }

    if(typeof data === 'object'){
      setIsDone(true);
    }

  }, [data]);

  if (isFetching || !isDone) {
    return <Loading />
  }

  return <>{children}</>;
};

export default function DrawerLayout() {
  return (
    <ConfigWrapper>
      <Drawer
        screenOptions={{ headerShown: false, drawerStyle: { width: "75%" }, swipeEdgeWidth: 0 }}
        drawerContent={(props) => <DrawerContent {...props} />}
      />
    </ConfigWrapper>
  )
}