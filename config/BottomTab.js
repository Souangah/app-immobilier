import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Accueil from '../screens/menu/accueil';
import Loyer from '../screens/loyers/loyer';
import Contrat from '../screens/documents/contrat';
import MesReclamation from '../screens/reclamations/mes-reclamation';
import Profil from '../screens/menu/profil';
import Header from './header';
import { GlobalContext } from './globaluser';

const Tab = createBottomTabNavigator();
const BLEU = '#275edd';
const GRIS = '#64748B';

// showHeader: false => cette page n'affiche pas le header unique
const TABS = [
  { name: 'Accueil',     component: Accueil,     label: 'Accueil',      icon: 'home',          showHeader: true },
  { name: 'Loyers',      component: Loyer,       label: 'Loyers',       icon: 'wallet',        showHeader: true },
  { name: 'Documents',   component: Contrat,     label: 'Documents',    icon: 'document-text', showHeader: true },
  { name: 'Reclamation', component: MesReclamation, label: 'Réclamations', icon: 'build',         showHeader: true },
  { name: 'Profil',      component: Profil,      label: 'Profil',       icon: 'person',        showHeader: true },
];

const TabLabel = ({ focused, label }) => (
  <View style={styles.labelWrap}>
    <Text
      numberOfLines={1}
      style={[styles.label, { color: focused ? BLEU : GRIS, fontWeight: focused ? '700' : '500' }]}
    >
      {label}
    </Text>
    <View style={[styles.underline, focused && styles.underlineActive]} />
  </View>
);

export default function BottomTab() {
  const { user } = useContext(GlobalContext);
  const insets = useSafeAreaInsets();
  const [bien, setBien] = useState(null);

  // Une seule requête pour alimenter le header de toutes les pages
  useEffect(() => {
    let actif = true;
    (async () => {
      try {
        const res = await fetch(
          `https://sidneyespace.net/paiement/info-bien.php?matricule=${user?.matricule || ''}`
        );
        const json = await res.json();
        if (actif && json.success) setBien(json.bien);
      } catch (e) {}
    })();
    return () => { actif = false; };
  }, [user?.matricule]);

  return (
    <Tab.Navigator
      initialRouteName="Accueil"
      screenOptions={{
        headerShown: true,
        header: ({ navigation }) => (
          <Header
            locataireName={user?.nom_prenom || user?.prenom || 'Locataire'}
            bien={bien}
            notifCount={3}
            onNotifPress={() => navigation.navigate('Notifications')}
            onProfilePress={() => navigation.navigate('Profil')}
            onLogementPress={() => navigation.navigate('Logement', { bien })}
          />
        ),
        tabBarShowLabel: true,
        tabBarActiveTintColor: BLEU,
        tabBarInactiveTintColor: GRIS,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 0,
          height: 66 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom,
          elevation: 16,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
        },
      }}
    >
      {TABS.map(({ name, component, label, icon, showHeader }) => (
        <Tab.Screen
          key={name}
          name={name}
          component={component}
          options={{
            headerShown: showHeader,
            tabBarLabel: ({ focused }) => <TabLabel focused={focused} label={label} />,
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? icon : `${icon}-outline`} size={26} color={color} />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  labelWrap: { alignItems: 'center', marginTop: 2 },
  label: { fontSize: 11.5 },
  underline: { marginTop: 5, width: 56, height: 3, borderRadius: 2, backgroundColor: 'transparent' },
  underlineActive: { backgroundColor: BLEU },
});