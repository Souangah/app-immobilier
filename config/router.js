import * as React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Connexion from '../screens/auth/connexion';
import BottomTab from './BottomTab';
import Paiement from '../screens/paiements/paiement';
import HistoriquePaiement from '../screens/paiements/historique-paiement';
import PaiementSuccess from '../screens/paiements/paiementSucces'; 
import PaiementEchec from '../screens/paiements/paiementEchec';
import { GlobalContext } from './globaluser';
import Recharge from '../screens/paiements/rechargement';
import HistoriqueRechargement from '../screens/paiements/historique-rechagement';
import ReportLoyer from '../screens/loyers/report-loyer';
import NouvelleReclamation from '../screens/reclamations/nouvelle-reclamation';
import MesReclamations from '../screens/reclamations/mes-reclamation';
import FAQReglement from '../screens/documents/FAQReglement';
import SplashScreen from '../screens/menu/SplashScreen';
import NotificationScreen from '../service/liste-notification';

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: ['sidneyespace://', 'https://sidneyespace.net'],
  config: {
    screens: {
      Connexion: 'connexion',
      BottomTab: 'accueil',
      Paiement: 'paiement',
      HistoriquePaiement: 'historique',
      PaiementSuccess: 'paiement/success',
      PaiementEchec: 'paiement/echec',
      NotificationScreen: 'notifications',
    }
  }
}

export default function Router(){
    const { user, loading } = React.useContext(GlobalContext);

    // On attend que AsyncStorage charge
    if (loading) {
      return (
        <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'white'}}>
          <ActivityIndicator size="large" color="#275edd" />
          <Text style={{marginTop:10, color:'#64748B'}}>Chargement...</Text>
        </View>
      );
    }

    return(
      <NavigationContainer linking={linking} fallback={<Text>Chargement...</Text>}>
        <Stack.Navigator initialRouteName={user ? "BottomTab" : "SplashScreen"}>
          <Stack.Screen name='Connexion' component={Connexion} options={{headerShown: false}}/>
          <Stack.Screen name='BottomTab' component={BottomTab} options={{headerShown: false}} />
          <Stack.Screen name='Paiement' component={Paiement} options={{headerShown: true, title: 'Paiement'}} />
          <Stack.Screen name='HistoriquePaiement' component={HistoriquePaiement} options={{headerShown: true, title: 'Historique'}} />
          <Stack.Screen name='PaiementSuccess' component={PaiementSuccess} options={{headerShown: false, presentation: 'fullScreenModal'}} />
          <Stack.Screen name='PaiementEchec' component={PaiementEchec} options={{headerShown: false, presentation: 'fullScreenModal'}} />
          <Stack.Screen name='Recharge' component={Recharge} options={{headerShown: false}} />
          <Stack.Screen name='HistoriqueRechargement' component={HistoriqueRechargement} options={{headerShown: false}} />
          <Stack.Screen name='ReportLoyer' component={ReportLoyer} options={{headerShown: false}}/>
          <Stack.Screen name='NouvelleReclamation' component={NouvelleReclamation} options={{headerShown: false}}/>
          <Stack.Screen name='MesReclamations' component={MesReclamations} options={{headerShown: false}}/>
          <Stack.Screen name='FAQReglement' component={FAQReglement} options={{headerShown: false}}/>
          <Stack.Screen name="SplashScreen" component={SplashScreen}  options={{headerShown: false}}/>
          <Stack.Screen name="NotificationScreen" component={NotificationScreen} options={{headerShown: false}}/>

        </Stack.Navigator>
      </NavigationContainer>
    )
}