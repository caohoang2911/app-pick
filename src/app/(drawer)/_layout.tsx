import { DrawerContent } from "@/components/DrawerContent";
import { Drawer } from "expo-router/drawer";
import { isEmpty } from "lodash";
import { useEffect, useState } from "react";
import { ConfigResponse, useGetConfig } from "~/src/api/config/useGetConfig";
import Loading from "~/src/components/Loading";
import { useAuth } from "~/src/core";
import { setConfig, useConfig } from "~/src/core/store/config";

const ConfigWrapper = ({ children }: { children: React.ReactNode }) => {
  const [isDone, setIsDone] = useState(false)
  const status = useAuth.use.status();
  const version = useConfig.use.version();
  const config = useConfig.use.config();

  console.log(config, "configconfigconfig");

  const { data, refetch, isFetching } = useGetConfig({ version: !isEmpty(config) ? version : "" });
  
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
    setIsDone(true);

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