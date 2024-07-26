import { signOut, useAuth } from "@/core";
import { useRouter } from "expo-router";
import React from "react";
import { Button, Text } from "react-native";

const Index = () => {
  const router = useRouter();

  const onSubmit = () => {
    signOut();
    router.push("/");
  };

  return <Button title="Logout" onPress={onSubmit} />;
};

export default Index;
