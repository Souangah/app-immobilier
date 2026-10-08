import React, { useContext } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Accueil from '../screens/menu/accueil';
import Contrat from '../screens/documents/contrat';
import Profil from '../screens/menu/profil';
import Header from './header';
import Loyer from '../screens/loyers/loyer';
import { GlobalContext } from './globaluser';

const Tab = createBottomTabNavigator();
const BLEU = '#275edd';

export default function BottomTab() { 
  const { user } = useContext(GlobalContext);
  const insets = useSafeAreaInsets();

  // HEADER UNIQUE STATIQUE
  const StaticHeader = () => (
    <Header
      locataireName={user?.nom_prenom || 'Locataire'}
      matricule={user?.matricule}
      solde={user?.solde_compte}
      etatCompte={user?.etat_compte}
    />
  );

  return (
    <Tab.Navigator
      screenOptions={{
        header: () => <StaticHeader />,
        tabBarShowLabel: true,
        tabBarActiveTintColor: BLEU,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          position: 'absolute',
          bottom: Math.max(8, insets.bottom > 0 ? insets.bottom - 10 : 8),
          left: 16, right: 16,
          backgroundColor: 'white',
          borderRadius: 20,
          height: 65,
          paddingTop: 4,
          paddingBottom: Platform.OS === 'ios' ? 8 : 4,
          shadowColor: BLEU,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.18,
          shadowRadius: 20,
          elevation: 10,
          borderTopWidth: 0,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (size) {} // ignore
          return null;
        },
      }}
    >
      <Tab.Screen 
        name="Accueil" 
        component={Accueil} 
        options={{
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
            </View>
          )
        }}
      />
      <Tab.Screen 
        name="Loyer" 
        component={Loyer} 
        options={{
          tabBarLabel: 'Mes Loyers',
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Ionicons name={focused ? 'card' : 'card-outline'} size={24} color={color} />
            </View>
          )
        }}
      />
      <Tab.Screen 
        name="Contrat" 
        component={Contrat} 
        options={{
          tabBarLabel: 'Mon Contrat',
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Ionicons name={focused ? 'document-text' : 'document-text-outline'} size={24} color={color} />
            </View>
          )
        }}
      />
      <Tab.Screen 
        name="Profil" 
        component={Profil} 
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Ionicons name={focused ? 'settings' : 'settings-outline'} size={24} color={color} />
            </View>
          )
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 44, height: 32,
    justifyContent: 'center', alignItems: 'center',
    borderRadius: 12,
  },
  iconContainerActive: { backgroundColor: '#EFF6FF' },
});