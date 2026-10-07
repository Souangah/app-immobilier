import { useEffect } from "react";
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import Router from './config/router';
import { GlobalProvider } from './config/globaluser';



export default function App() {



  return (
    <GlobalProvider>
      <Router />
    </GlobalProvider>
  );
}