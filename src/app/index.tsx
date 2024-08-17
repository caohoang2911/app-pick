import { Redirect } from 'expo-router';
import React from 'react';

const Index = () => {
  return <Redirect href={'/orders'} />;
};

export default Index;
