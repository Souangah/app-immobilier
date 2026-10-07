import * as React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Connexion from '../screens/connexion';
import BottomTab from './BottomTab';
import Paiement from '../screens/paiement';
import HistoriquePaiement from '../screens/historique-paiement';
import PaiementSuccess from '../screens/paiementSucces'; 
import PaiementEchec from '../screens/paiementEchec';
import { GlobalContext } from './globaluser';
import Recharge from '../screens/rechargement';
import HistoriqueRechargement from '../screens/historique-rechagement';
import ReportLoyer from '../screens/report-loyer';
import NouvelleReclamation from '../screens/nouvelle-reclamation';

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
        <Stack.Navigator initialRouteName={user ? "BottomTab" : "Connexion"}>
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
        </Stack.Navigator>
      </NavigationContainer>
    )
}