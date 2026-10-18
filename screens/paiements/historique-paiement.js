import React, { useContext, useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput, Linking } from 'react-native';
import { GlobalContext } from '../../config/globaluser';
import { Ionicons } from '@expo/vector-icons';

const BLEU = '#275edd';
const API_BASE = 'https://sidneyespace.net/paiement';

export default function HistoriquePaiement() {
  const { user } = useContext(GlobalContext);
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState('TOUS');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistorique = async () => {
    try {
      const res = await fetch(`${API_BASE}/historique-paiement.php?matricule=${user.matricule}`);
      const json = await res.json();
      if (json.success) setData(json.paiements);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchHistorique(); }, []);

  // FILTRE + RECHERCHE
  const filtered = useMemo(() => {
    let list = filter === 'TOUS' ? data : data.filter(d => d.etat === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d => 
        (d.mois + ' ' + d.annee).toLowerCase().includes(q) ||
        d.id_paiement.toLowerCase().includes(q) ||
        d.id_loyer.toLowerCase().includes(q) ||
        d.montant.toString().includes(q) ||
        d.mode_reglement.toLowerCase().includes(q)
      );
    }
    return list;
  }, [data, filter, search]);

  const totalPaye = data.filter(d=>d.etat==='Succes' || d.etat==='Payé').reduce((s,i)=>s+parseFloat(i.montant),0);

  const getStatusStyle = (etat) => {
    if (etat === 'Payé' || etat === 'Succes') return {bg:'#DCFCE7', color:'#16A34A', icon:'checkmark-circle'};
    if (etat === 'Partiel') return {bg:'#FFFBEB', color:'#F59E0B', icon:'hourglass'};
    if (etat === 'En attente') return {bg:'#EFF6FF', color:BLEU, icon:'time'};
    return {bg:'#FEE2E2', color:'#EF4444', icon:'close-circle'};
  };

  const downloadRecu = (item) => {
    Linking.openURL(`${API_BASE}/recu.php?numero=${item.id_paiement}`);
  };

  const renderItem = ({item}) => {
    const st = getStatusStyle(item.etat);
    return (
      <View style={styles.card}>
        {/* LIGNE 1 */}
        <View style={styles.cardHeader}>
          <View style={[styles.statusDot, {backgroundColor: st.color}]} />
          <Text style={styles.mois}>{item.mois} {item.annee}</Text>
          <View style={[styles.badge, {backgroundColor: st.bg}]}>
            <Ionicons name={st.icon} size={12} color={st.color} />
            <Text style={[styles.badgeText, {color: st.color}]}>{item.etat}</Text>
          </View>
        </View>

        {/* LIGNE 2 - ALIGNEMENT VERTICAL */}
        <View style={styles.rowInfo}>
          <View style={styles.col}>
            <Text style={styles.label}>Réf loyer</Text>
            <Text style={styles.value}>{item.id_loyer}</Text>
          </View>
          <View style={styles.colRight}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{item.date_paiement}</Text>
          </View>
        </View>

        <View style={styles.rowInfo}>
          <View style={styles.col}>
            <Text style={styles.label}>Montant payé</Text>
            <Text style={styles.montant}>{Number(item.montant).toLocaleString('fr-FR')} FCFA</Text>
          </View>
          <View style={styles.colRight}>
            <Text style={styles.label}>Mode</Text>
            <Text style={styles.value}>{item.mode_reglement}</Text>
            <Text style={styles.subValue}>{item.id_paiement}</Text>
          </View>
        </View>

        {(item.etat === 'Succes' || item.etat === 'Payé') && (
          <TouchableOpacity style={styles.btnRecu} onPress={()=>downloadRecu(item)}>
            <Ionicons name="download" size={14} color={BLEU} />
            <Text style={styles.btnRecuText}>Télécharger quittance PDF</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) return <View style={[styles.container,{justifyContent:'center',alignItems:'center'}]}><ActivityIndicator color={BLEU} size="large" /></View>;

  return (
    <View style={styles.container}>
      {/* STATS */}
      <View style={styles.statsBox}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{data.length}</Text>
          <Text style={styles.statLabel}>Paiements</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={[styles.statValue,{color:'#16A34A'}]}>{totalPaye.toLocaleString('fr-FR')} F</Text>
          <Text style={styles.statLabel}>Total payé</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{data.filter(d=>d.etat==='Succes').length}</Text>
          <Text style={styles.statLabel}>Quittances</Text>
        </View>
      </View>

      {/* RECHERCHE */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={16} color="#94A3B8" />
        <TextInput
          placeholder="Rechercher mois, montant, réf..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={()=>setSearch('')}>
            <Ionicons name="close-circle" size={16} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* FILTRES */}
      <View style={styles.filterRow}>
        {['TOUS','Succes','Partiel','En attente','Echec'].map(f=>(
          <TouchableOpacity key={f} onPress={()=>setFilter(f)} style={[styles.filterChip, filter===f && {backgroundColor:BLEU, borderColor:BLEU}]}>
            <Text style={[styles.filterText, filter===f && {color:'white'}]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item)=>item.id_paiement}
        renderItem={renderItem}
        contentContainerStyle={{padding:16, paddingBottom:100}}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true); fetchHistorique();}} colors={[BLEU]} />}
        ListEmptyComponent={<View style={{alignItems:'center', marginTop:60}}><Ionicons name="receipt-outline" size={48} color="#CBD5E1" /><Text style={{color:'#94A3B8', marginTop:12}}>Aucun résultat pour "{search}"</Text></View>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:{flex:1, backgroundColor:'#F8FAFC'},
  statsBox:{flexDirection:'row', backgroundColor:'white', margin:16, marginBottom:10, borderRadius:16, padding:14, borderWidth:1, borderColor:'#F1F5F9'},
  stat:{flex:1, alignItems:'center'},
  statValue:{fontSize:14, fontWeight:'900', color:'#0F172A'},
  statLabel:{fontSize:9, color:'#64748B', fontWeight:'700', marginTop:2, textTransform:'uppercase'},
  statDivider:{width:1, backgroundColor:'#F1F5F9'},
  searchBox:{flexDirection:'row', alignItems:'center', backgroundColor:'white', marginHorizontal:16, marginBottom:10, borderRadius:12, paddingHorizontal:12, height:42, borderWidth:1, borderColor:'#E2E8F0', gap:8},
  searchInput:{flex:1, fontSize:13, color:'#0F172A', fontWeight:'500'},
  filterRow:{flexDirection:'row', gap:6, paddingHorizontal:16, paddingBottom:12, flexWrap:'wrap'},
  filterChip:{paddingHorizontal:12, paddingVertical:6, borderRadius:20, backgroundColor:'white', borderWidth:1, borderColor:'#E2E8F0'},
  filterText:{fontSize:11, fontWeight:'700', color:'#64748B'},
  card:{backgroundColor:'white', borderRadius:16, padding:14, marginBottom:10, borderWidth:1, borderColor:'#F1F5F9'},
  cardHeader:{flexDirection:'row', alignItems:'center', gap:8},
  statusDot:{width:8, height:8, borderRadius:4},
  mois:{flex:1, fontSize:13, fontWeight:'800', color:'#0F172A'},
  badge:{flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:8, paddingVertical:3, borderRadius:8},
  badgeText:{fontSize:10, fontWeight:'800'},
  // ALIGNEMENT VERTICAL
  rowInfo:{flexDirection:'row', justifyContent:'space-between', marginTop:12},
  col:{flex:1, flexDirection:'column'},
  colRight:{flex:1, flexDirection:'column', alignItems:'flex-end'},
  label:{fontSize:9, color:'#94A3B8', fontWeight:'700', textTransform:'uppercase', letterSpacing:0.5},
  value:{fontSize:12, fontWeight:'600', color:'#334155', marginTop:2},
  subValue:{fontSize:10, color:'#94A3B8', marginTop:2},
  montant:{fontSize:15, fontWeight:'900', color:'#0F172A', marginTop:2},
  btnRecu:{flexDirection:'row', alignItems:'center', gap:6, backgroundColor:'#EFF6FF', borderRadius:10, padding:10, justifyContent:'center', marginTop:14, borderWidth:1, borderColor:'#DBEAFE'},
  btnRecuText:{color:BLEU, fontSize:12, fontWeight:'800'}
});