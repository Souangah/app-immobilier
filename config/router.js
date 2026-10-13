import * as React from 'react';
import { View, ActivityIndicator, Linking } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
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

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Analyse une URL du type :
 *   sidneyespace://paiement/success?numero=RCH123
 *   sidneyespace://paiement/echec?numero=RCH123
 * Retourne { numero, screen } ou null.
 */
function parseDeepLink(url) {
  if (!url) return null;
  try {
    const match = url.match(/numero=([^&#]+)/);
    if (!match) return null;
    return {
      numero: decodeURIComponent(match[1]),
      screen: /paiement\/echec/.test(url) ? 'PaiementEchec' : 'PaiementSuccess',
    };
  } catch {
    return null;
  }
}

export default function Router() {
  const { user, loading } = React.useContext(GlobalContext);
  const navigationRef = useNavigationContainerRef();
  const pendingRef = React.useRef(null);
  // undefined = pas encore vérifié | null = aucun lien | objet = lien de paiement
  const [initialLink, setInitialLink] = React.useState(undefined);

  // Ouvre l'écran de résultat (immédiatement, ou dès que la navigation est prête)
  const goTo = React.useCallback((link) => {
    if (!link) return;
    if (navigationRef.isReady()) {
      navigationRef.reset({
        index: 0,
        routes: [{ name: link.screen, params: { numero: link.numero } }],
      });
    } else {
      pendingRef.current = link;
    }
  }, [navigationRef]);

  // 1. App fermée -> ouverte par le lien : on lit l'URL AVANT d'afficher la navigation
  React.useEffect(() => {
    Linking.getInitialURL()
      .then((url) => setInitialLink(parseDeepLink(url)))
      .catch(() => setInitialLink(null));
  }, []);

  // 2. App déjà ouverte (retour depuis le navigateur / Wave) + 3. clic sur notification
  React.useEffect(() => {
    const subLink = Linking.addEventListener('url', ({ url }) => goTo(parseDeepLink(url)));

    const subNotif = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      const numero = data?.id || data?.numero;
      if (numero) {
        goTo({
          numero,
          screen: data.type?.includes('echec') ? 'PaiementEchec' : 'PaiementSuccess',
        });
      }
    });

    return () => {
      subLink.remove();
      subNotif.remove();
    };
  }, [goTo]);

  if (loading || initialLink === undefined) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0D5C2E" />
      </View>
    );
  }

  // Si l'app a été lancée par un lien de paiement, on démarre directement sur l'écran résultat
  // (le SplashScreen ne peut plus l'écraser).
  const initialRoute = initialLink ? initialLink.screen : (user ? 'BottomTab' : 'SplashScreen');
  const paramsFor = (screen) =>
    initialLink?.screen === screen ? { numero: initialLink.numero } : undefined;

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        // Lien reçu pendant que la navigation n'était pas encore montée
        if (pendingRef.current) {
          const link = pendingRef.current;
          pendingRef.current = null;
          goTo(link);
        }
      }}
    >
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen name="Connexion" component={Connexion} options={{ headerShown: false }} />
        <Stack.Screen name="BottomTab" component={BottomTab} options={{ headerShown: false }} />
        <Stack.Screen
          name="PaiementSuccess"
          component={PaiementSuccess}
          initialParams={paramsFor('PaiementSuccess')}
          options={{ headerShown: false, presentation: 'fullScreenModal' }}
        />
        <Stack.Screen
          name="PaiementEchec"
          component={PaiementEchec}
          initialParams={paramsFor('PaiementEchec')}
          options={{ headerShown: false, presentation: 'fullScreenModal' }}
        />
        <Stack.Screen name="Paiement" component={Paiement} options={{ headerShown: false }} />
        <Stack.Screen name="HistoriquePaiement" component={HistoriquePaiement} options={{ headerShown: false }} />
        <Stack.Screen name="Recharge" component={Recharge} options={{ headerShown: false }} />
        <Stack.Screen name="HistoriqueRechargement" component={HistoriqueRechargement} options={{ headerShown: false }} />
        <Stack.Screen name="ReportLoyer" component={ReportLoyer} options={{ headerShown: false }} />
        <Stack.Screen name="NouvelleReclamation" component={NouvelleReclamation} options={{ headerShown: false }} />
        <Stack.Screen name="MesReclamations" component={MesReclamations} options={{ headerShown: false }} />
        <Stack.Screen name="FAQReglement" component={FAQReglement} options={{ headerShown: false }} />
        <Stack.Screen name="SplashScreen" component={SplashScreen} options={{ headerShown: false }} />
        <Stack.Screen name="NotificationScreen" component={NotificationScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}