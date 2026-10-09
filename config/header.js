import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Image,
  ImageBackground
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const BLEU = '#275edd';
const TOP = Platform.OS === 'ios'? 44 : (StatusBar.currentHeight || 24) + 4;

export default function Header({
  locataireName = 'Locataire',
  notifCount = 3,
  bien = null,
  onNotifPress,
  onProfilePress,
  onLogementPress
}) {
  // Données qui viennent de l'API info-local-mandat.php
  const intituleLocal = bien?.intitule_local || 'Appartement A12';
  const intituleMandat = bien?.intitule_mandat || 'Résidence Les Palmiers';
  const ville = bien?.ville || 'Abidjan';
  const quartier = bien?.quartier || 'Cocody';
  const adresse = bien?.adresse || 'Riviera';
  const image = bien?.image || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=300';

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={styles.container}>
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800' }}
          style={StyleSheet.absoluteFill}
          imageStyle={{ opacity: 0.6, resizeMode: 'cover' }}
        />
        <LinearGradient
          colors={['#2352D8', 'rgba(39,94,221,0.88)', 'rgba(39,94,221,0.35)']}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.topRow}>
          <TouchableOpacity style={styles.logoRow} onPress={onProfilePress} activeOpacity={0.8}>
            <Text style={styles.logoText}>GS</Text>
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.logoLabel}>GROUPE</Text>
              <Text style={styles.logoLabelBold}>SIDNEY</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.bellBtn} onPress={onNotifPress} activeOpacity={0.8}>
            <Ionicons name="notifications" size={26} color="white" />
            {notifCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notifCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.hello}>Bonjour, {locataireName} 👋</Text>
        <Text style={styles.subHello}>Bienvenue sur votre espace locataire</Text>
      </View>

      <View style={styles.wave} />

      {/* CARD LOGEMENT AVEC INFOS MANDAT + LOCAL */}
      <TouchableOpacity activeOpacity={0.9} style={styles.logementCard} onPress={onLogementPress}>
        <Image source={{ uri: image }} style={styles.logementImg} />
        <View style={{ flex: 1 }}>
          <Text style={styles.logementLabel}>Mon logement</Text>
          <Text style={styles.logementTitle} numberOfLines={1}>{intituleLocal}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <Ionicons name="location-sharp" size={13} color="#0F172A" />
            <Text style={styles.logementAddr} numberOfLines={1}> {intituleMandat}</Text>
          </View>
          <Text style={styles.logementSub} numberOfLines={1}>{adresse} - {quartier} - {ville}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#0F172A" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { backgroundColor: '#F6F8FC', paddingBottom: 4 },
  container: { backgroundColor: BLEU, paddingTop: TOP, paddingBottom: 58, paddingHorizontal: 20, overflow: 'hidden' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoText: { color: 'white', fontWeight: '900', fontSize: 30, fontStyle: 'italic', letterSpacing: -3 },
  logoLabel: { color: 'white', fontWeight: '500', fontSize: 12, letterSpacing: 2, lineHeight: 14 },
  logoLabelBold: { color: 'white', fontWeight: '800', fontSize: 14.5, letterSpacing: 1.5, lineHeight: 16 },
  bellBtn: { width: 38, height: 38, justifyContent: 'center', alignItems: 'center' },
  badge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#EF4444', minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: 'white', fontSize: 10, fontWeight: '800' },
  hello: { color: 'white', fontSize: 22, fontWeight: '800', marginTop: 12, zIndex: 2 },
  subHello: { color: 'rgba(255,255,255,0.95)', fontSize: 13, marginTop: 3, zIndex: 2 },
  wave: { height: 22, backgroundColor: '#F6F8FC', marginTop: -22, borderTopLeftRadius: 28, borderTopRightRadius: 28, zIndex: 2 },
  logementCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', marginHorizontal: 16, marginTop: -38, borderRadius: 18, padding: 10, elevation: 8, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 14, zIndex: 10 },
  logementImg: { width: 66, height: 54, borderRadius: 10, marginRight: 12 },
  logementLabel: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  logementTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginTop: 1 },
  logementAddr: { fontSize: 11, color: '#0F172A', fontWeight: '700', flex: 1 },
  logementSub: { fontSize: 10, color: '#94A3B8', marginLeft: 16, marginTop: 1 }
});