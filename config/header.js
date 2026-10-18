import React, { useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar, Image, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { GlobalContext } from './globaluser';

const BLEU = '#275edd';
const TOP = Platform.OS === 'ios'? 44 : (StatusBar.currentHeight || 24) + 4;

export default function Header({ locataireName, bien = null, onProfilePress }) {
  const { user } = useContext(GlobalContext);
  const navigation = useNavigation();
  const [notifCount, setNotifCount] = useState(0);

  // Le header va chercher son propre chiffre
  const fetchCount = useCallback(async () => {
    if(!user?.matricule) return;
    try {
      const res = await fetch(`https://sidneyespace.net/paiement/get-notifications.php?matricule=${user.matricule}`);
      const json = await res.json();
      if(json.success) setNotifCount(json.count);
    } catch(e) {}
  }, [user?.matricule]);

  useFocusEffect(useCallback(() => { fetchCount(); }, [fetchCount]));

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={styles.container}>
        <ImageBackground source={require("../assets/images/bien2.jpeg")} style={StyleSheet.absoluteFill} imageStyle={{ opacity: 0.6, resizeMode: 'cover' }} />
        <LinearGradient colors={['#2352D8', 'rgba(39,94,221,0.88)', 'rgba(39,94,221,0.35)']} locations={[0, 0.55, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.logoRow} onPress={onProfilePress} activeOpacity={0.8}>
            <Text style={styles.logoSidney}>SIDNEY</Text><Text style={styles.logoEspace}>ESPACE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate('NotificationScreen')} activeOpacity={0.8}>
            <Ionicons name="notifications" size={26} color="white" />
            {notifCount > 0 && (<View style={styles.badge}><Text style={styles.badgeText}>{notifCount > 99? '99+' : notifCount}</Text></View>)}
          </TouchableOpacity>
        </View>
        <Text style={styles.hello}>Bonjour, {locataireName || user?.nom} 👋</Text>
        <Text style={styles.subHello}>Bienvenue sur votre espace locataire</Text>
      </View>
      <View style={styles.wave} />
      <TouchableOpacity activeOpacity={0.9} style={styles.logementCard}>
        {bien?.image? (<Image source={{ uri: bien.image }} style={styles.logementImg} />) : (<View style={styles.logementIconBox}><Ionicons name="home" size={28} color={BLEU} /></View>)}
        <View style={styles.logementContent}>
          <Text style={styles.logementLabel}>Mon logement</Text>
          <Text style={styles.logementTitle} numberOfLines={1}>{bien?.intitule_local || 'Appartement A12'}</Text>
          <View style={styles.logementLocationRow}><Ionicons name="location-sharp" size={13} color="#0F172A" /><Text style={styles.logementAddr} numberOfLines={1}> {bien?.intitule_mandat || 'Résidence Les Palmiers'}</Text></View>
          <Text style={styles.logementSub} numberOfLines={1}>{bien?.adresse || 'Riviera'} - {bien?.quartier || 'Cocody'} - {bien?.ville || 'Abidjan'}</Text>
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
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoSidney: { color: 'white', fontWeight: '900', fontSize: 18, letterSpacing: 1 },
  logoEspace: { color: 'rgba(255,255,255,0.85)', fontWeight: '500', fontSize: 18, letterSpacing: 1 },
  bellBtn: { width: 38, height: 38, justifyContent: 'center', alignItems: 'center' },
  badge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#EF4444', minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: 'white', fontSize: 10, fontWeight: '800' },
  hello: { color: 'white', fontSize: 22, fontWeight: '800', marginTop: 12, zIndex: 2 },
  subHello: { color: 'rgba(255,255,255,0.95)', fontSize: 13, marginTop: 3, zIndex: 2 },
  wave: { height: 22, backgroundColor: '#F6F8FC', marginTop: -22, borderTopLeftRadius: 28, borderTopRightRadius: 28, zIndex: 2 },
  logementCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', marginHorizontal: 16, marginTop: -38, borderRadius: 18, padding: 10, elevation: 8, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 14, zIndex: 10 },
  logementImg: { width: 66, height: 54, borderRadius: 10, marginRight: 12 },
  logementIconBox: { width: 66, height: 54, borderRadius: 10, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  logementContent: { flex: 1 },
  logementLabel: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  logementTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginTop: 1 },
  logementLocationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  logementAddr: { fontSize: 11, color: '#0F172A', fontWeight: '700', flex: 1 },
  logementSub: { fontSize: 10, color: '#94A3B8', marginLeft: 16, marginTop: 1 },
});