import * as React from 'react';
import { View, Text, ActivityIndicator, Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
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
export const navigationRef = React.createRef();

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
};

function extractData(raw) {
  if (!raw) return {};
  let data = { ...raw };
  ['data', 'body'].forEach((k) => {
    const v = raw[k];
    if (typeof v === 'string') {
      try { data = { ...data, ...JSON.parse(v) }; } catch {}
    } else if (v && typeof v === 'object') {
      data = { ...data, ...v };
    }
  });
  return data;
}

function decideScreen(data) {
  const t = String(data.type || data.statut || data.etat || '').toLowerCase();
  if (t.includes('echec') || t.includes('fail') || t.includes('annul')) return 'PaiementEchec';
  if (t.includes('succes') || t.includes('success') || t.includes('confirm') || t.includes('paye')) return 'PaiementSuccess';
  return null;
}

async function navigateFromNotifData(raw) {
  if (!navigationRef.current) return;
  const data = extractData(raw);
  const numero = String(data.numero || data.id || data.ref || '');
  let screen = decideScreen(data);

  // fallback serveur si pas de statut clair
  if (!screen && numero) {
    try {
      const r = await fetch(`https://sidneyespace.net/paiement/get-paiement.php?numero=${numero}`);
      const j = await r.json();
      if (j?.success && j.paiement) screen = decideScreen({ etat: j.paiement.etat });
    } catch {}
  }

  if (screen) {
    navigationRef.current.navigate(screen, { numero });
  } else {
    navigationRef.current.navigate('NotificationScreen');
  }
}

export default function Router() {
  const { user, loading } = React.useContext(GlobalContext);

  React.useEffect(() => {
    // 1. Clic quand app ouverte / background - c'est le seul qui doit naviguer
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const raw = response.notification.request.content.data;
      console.log('NOTIF CLICK:', raw);
      navigateFromNotifData(raw);
    });

    // 2. Au démarrage, on NETTOIE l'ancienne réponse sans naviguer
    // Sinon elle t'ouvre NotificationScreen à chaque démarrage
    (async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        // Si on revient de Wave via deep link, on laisse le linking faire le travail
        if (initialUrl && initialUrl.includes('paiement')) {
          console.log('RETOUR WAVE DEEP LINK:', initialUrl);
          // On efface la vieille notif pour qu'elle ne revienne pas
          if (Notifications.dismissAllNotificationsAsync) {
            await Notifications.dismissAllNotificationsAsync();
          }
          return;
        }

        // Sinon on efface la dernière réponse stockée par Expo
        const last = await Notifications.getLastNotificationResponseAsync();
        if (last) {
          console.log('VIEILLE NOTIF DETECTEE, ON EFFACE:', last.notification.request.content.data);
          // Dans les SDK récents cette fonction existe, sinon on ignore
          if (Notifications.clearLastNotificationResponseAsync) {
            await Notifications.clearLastNotificationResponseAsync();
          }
        }
      } catch (e) {
        console.log('clean notif error', e);
      }
    })();

    return () => sub.remove();
  }, []);

  if (loading) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'white' }}>
        <ActivityIndicator size="large" color="#275edd" />
        <Text style={{ marginTop:10, color:'#64748B' }}>Chargement...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      fallback={<Text>Chargement...</Text>}
    >
      <Stack.Navigator initialRouteName={'Connexion'}>
        <Stack.Screen name='Connexion' component={Connexion} options={{ headerShown: false }} />
        <Stack.Screen name='BottomTab' component={BottomTab} options={{ headerShown: false }} />
        <Stack.Screen name='Paiement' component={Paiement} options={{ headerShown: true, title: 'Paiement' }} />
        <Stack.Screen name='HistoriquePaiement' component={HistoriquePaiement} options={{ headerShown: true, title: 'Historique' }} />
        <Stack.Screen name='PaiementSuccess' component={PaiementSuccess} options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name='PaiementEchec' component={PaiementEchec} options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name='Recharge' component={Recharge} options={{ headerShown: false }} />
        <Stack.Screen name='HistoriqueRechargement' component={HistoriqueRechargement} options={{ headerShown: false }} />
        <Stack.Screen name='ReportLoyer' component={ReportLoyer} options={{ headerShown: false }} />
        <Stack.Screen name='NouvelleReclamation' component={NouvelleReclamation} options={{ headerShown: false }} />
        <Stack.Screen name='MesReclamations' component={MesReclamations} options={{ headerShown: false }} />
        <Stack.Screen name='FAQReglement' component={FAQReglement} options={{ headerShown: false }} />
        <Stack.Screen name="SplashScreen" component={SplashScreen} options={{ headerShown: false }} />
        <Stack.Screen name="NotificationScreen" component={NotificationScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}