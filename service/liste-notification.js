import React, { useEffect, useState, useContext, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from '@react-navigation/native';
import { GlobalContext } from '../config/globaluser';

const BLEU = '#275edd';

const TYPE_CONFIG = {
  paiement_succes: { icon: 'checkmark-circle', color: '#16A34A', bg: '#DCFCE7' },
  paiement_confirme: { icon: 'checkmark-circle', color: '#16A34A', bg: '#DCFCE7' },
  solde_insuffisant: { icon: 'wallet', color: '#EF4444', bg: '#FEE2E2' },
  solde_faible: { icon: 'wallet', color: '#F97316', bg: '#FFEDD5' },
  loyer_retard: { icon: 'alert-circle', color: '#EF4444', bg: '#FEE2E2' },
  loyer_a_venir: { icon: 'calendar', color: BLEU, bg: '#DBEAFE' },
  recu_disponible: { icon: 'receipt', color: '#9333EA', bg: '#F3E8FF' },
  report_accepte: { icon: 'checkmark-done', color: '#16A34A', bg: '#DCFCE7' },
  report_refuse: { icon: 'close-circle', color: '#EF4444', bg: '#FEE2E2' },
  travaux: { icon: 'construct', color: '#F97316', bg: '#FFEDD5' },
  annonce: { icon: 'megaphone', color: BLEU, bg: '#DBEAFE' },
  default: { icon: 'notifications', color: BLEU, bg: '#DBEAFE' }
};

function getConfig(type) { return TYPE_CONFIG[type] || TYPE_CONFIG.default; }
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000 / 60);
  if (diff < 1) return "À l'instant";
  if (diff < 60) return `Il y a ${diff} min`;
  if (diff < 1440) return `Il y a ${Math.floor(diff/60)}h`;
  return d.toLocaleDateString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
}

export default function NotificationsScreen({ navigation }) {
  const { user } = useContext(GlobalContext);
  const [notifications, setNotifications] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasAutoRead = useRef(false);

  const fetchNotifs = useCallback(async () => {
    if (!user?.matricule) return;
    try {
      const res = await fetch(`https://sidneyespace.net/paiement/get-notifications.php?matricule=${user.matricule}`);
      const json = await res.json();
      if (json.success) {
        setNotifications(json.notifications);
        setCount(json.count);
        await Notifications.setBadgeCountAsync(json.count);
      }
    } catch (e) { console.log(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [user?.matricule]);

  useFocusEffect(useCallback(() => {
    hasAutoRead.current = false; // reset à chaque ouverture
    fetchNotifs();
  }, [fetchNotifs]));

  // === LECTURE AUTOMATIQUE EN useEffect ===
  useEffect(() => {
    if (!hasAutoRead.current && notifications.length > 0 && count > 0) {
      hasAutoRead.current = true;
      const timer = setTimeout(async () => {
        // UI direct
        setNotifications(prev => prev.map(n => ({...n, statut:'lu'})));
        setCount(0);
        await Notifications.setBadgeCountAsync(0);
        // API
        try {
          await fetch('https://sidneyespace.net/paiement/mark-read.php', {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ locataire: user.matricule })
          });
        } catch(e) {}
      }, 1500); // 1.5s après ouverture
      return () => clearTimeout(timer);
    }
  }, [notifications, count, user?.matricule]);

  const markAsRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id? {...n, statut:'lu'} : n));
    setCount(prev => {
      const newCount = Math.max(0, prev -1);
      Notifications.setBadgeCountAsync(newCount);
      return newCount;
    });
    try {
      await fetch('https://sidneyespace.net/paiement/mark-read.php', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ id })
      });
    } catch(e) {}
  };

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({...n, statut:'lu'})));
    setCount(0);
    await Notifications.setBadgeCountAsync(0);
    try {
      await fetch('https://sidneyespace.net/paiement/mark-read.php', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ locataire: user.matricule })
      });
    } catch(e) {}
  };

  const renderItem = ({ item }) => {
    const config = getConfig(item.type);
    const isUnread = item.statut === 'non_lu';
    return (
      <TouchableOpacity style={[styles.card, isUnread && styles.cardUnread]} onPress={() => markAsRead(item.id)} activeOpacity={0.8}>
        <View style={[styles.iconBox, { backgroundColor: config.bg }]}><Ionicons name={config.icon} size={22} color={config.color} /></View>
        <View style={styles.content}>
          <View style={styles.rowTop}><Text style={styles.titre} numberOfLines={1}>{item.titre}</Text>{isUnread && <View style={styles.dot} />}</View>
          <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
          <View style={styles.rowBottom}><Text style={styles.date}>{formatDate(item.date)}</Text><View style={[styles.badgeType, { backgroundColor: config.bg }]}><Text style={[styles.badgeTypeText, { color: config.color }]}>{item.type}</Text></View></View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={BLEU} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#0F172A" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {count > 0? <TouchableOpacity onPress={markAllRead}><Text style={styles.markAll}>Tout lire</Text></TouchableOpacity> : <View style={{width:38}} />}
      </View>
      {count > 0 && (<View style={styles.countBanner}><Ionicons name="notifications" size={16} color="white" /><Text style={styles.countBannerText}>{count} non lue(s)</Text></View>)}
      <FlatList data={notifications} keyExtractor={(item) => String(item.id)} renderItem={renderItem} contentContainerStyle={{ padding: 16, paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifs(); }} colors={[BLEU]} />} ListEmptyComponent={<View style={styles.centerEmpty}><View style={styles.emptyIconBox}><Ionicons name="notifications-off-outline" size={48} color="#94A3B8" /></View><Text style={styles.emptyTitle}>Aucune notification</Text><Text style={styles.emptySub}>Vous serez notifié ici pour vos loyers et paiements</Text></View>} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#F6F8FC' },
  center: { flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#F6F8FC' },
  header: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingTop:50, paddingBottom:16, paddingHorizontal:16, backgroundColor:'white', elevation:2 },
  backBtn: { width:38, height:38, borderRadius:19, backgroundColor:'#F1F5F9', justifyContent:'center', alignItems:'center' },
  headerTitle: { fontSize:18, fontWeight:'800', color:'#0F172A' },
  markAll: { color:BLEU, fontWeight:'700', fontSize:13 },
  countBanner: { flexDirection:'row', alignItems:'center', gap:6, backgroundColor:BLEU, margin:16, padding:10, borderRadius:12 },
  countBannerText: { color:'white', fontWeight:'700', fontSize:13 },
  card: { flexDirection:'row', backgroundColor:'white', borderRadius:16, padding:12, marginBottom:12, elevation:1, shadowColor:'#0F172A', shadowOpacity:0.05, shadowRadius:8 },
  cardUnread: { borderLeftWidth:3, borderLeftColor:BLEU, backgroundColor:'#FFFFFF' },
  iconBox: { width:44, height:44, borderRadius:12, justifyContent:'center', alignItems:'center', marginRight:12 },
  content: { flex:1 },
  rowTop: { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  titre: { fontSize:14, fontWeight:'800', color:'#0F172A', flex:1 },
  dot: { width:8, height:8, borderRadius:4, backgroundColor:BLEU, marginLeft:8 },
  message: { fontSize:12, color:'#475569', marginTop:4, lineHeight:16 },
  rowBottom: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:8 },
  date: { fontSize:10, color:'#94A3B8' },
  badgeType: { paddingHorizontal:8, paddingVertical:2, borderRadius:8 },
  badgeTypeText: { fontSize:9, fontWeight:'700' },
  centerEmpty: { alignItems:'center', marginTop:80, paddingHorizontal:30 },
  emptyIconBox: { width:80, height:80, borderRadius:40, backgroundColor:'#F1F5F9', justifyContent:'center', alignItems:'center', marginBottom:16 },
  emptyTitle: { fontSize:16, fontWeight:'800', color:'#0F172A' },
  emptySub: { fontSize:13, color:'#94A3B8', textAlign:'center', marginTop:6 }
});