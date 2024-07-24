import { useRouter } from "expo-router";
import React from "react";
import { useAuth } from "@/core";
import { Button, Text } from "react-native";

export default function Login() {
  const router = useRouter();
  const signIn = useAuth.use.signIn();

  const onSubmit = () => {
    signIn({ access: "access-token", refresh: "refresh-token" });
    router.push("/");
  };
  return (
    <>
      <Text>432423432</Text>
      <Button onPress={onSubmit} title="Login" />
    </>
  );
}
