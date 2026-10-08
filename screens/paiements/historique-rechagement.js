import React, { useContext, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, Pressable } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { GlobalContext } from "../../config/globaluser";

const BLEU = '#275edd';

function formatMoney(v) {
  const n = parseInt((v||"").toString().replace(/\D/g,"")) || 0;
  return n.toLocaleString('fr-FR');
}

export default function HistoriqueRechargement({ navigation }) {
  const { user } = useContext(GlobalContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const loadData = async () => {
    try {
      const res = await fetch(`https://sidneyespace.net/paiement/historique-rechargement.php?matricule=${user?.matricule}`);
      const json = await res.json();
      if(json.success) setData(json.data);
    } catch(e) { console.log(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadData(); }, []);

  const openDetail = (item) => {
    setSelected(item);
    setShowModal(true);
  };

  const getStatusStyle = (statut) => {
    const s = (statut||"").toLowerCase();
    if(s.includes('paye') || s.includes('succ') || s.includes('valid') || s.includes('réussi')) return { bg:'#DCFCE7', color:'#16A34A', label:'Réussi', icon:'checkmark-circle' };
    if(s.includes('attent') || s.includes('cours') || s.includes('en attente')) return { bg:'#FEF9C3', color:'#CA8A04', label:'En attente', icon:'time' };
    if(s.includes('echou') || s.includes('fail') || s.includes('echec')) return { bg:'#FEE2E2', color:'#DC2626', label:'Échoué', icon:'close-circle' };
    return { bg:'#EFF6FF', color:BLEU, label: statut||'Traité', icon:'wallet' };
  };

  if(loading) return <View style={styles.loading}><ActivityIndicator color={BLEU} size="large" /><Text style={{marginTop:10, color:'#64748B'}}>Chargement...</Text></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={BLEU} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historique rechargement</Text>
        <View style={{width:40}} />
      </View>

      <ScrollView 
        contentContainerStyle={{padding:16, paddingBottom:30}}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} colors={[BLEU]} />}
      >
        {data.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="wallet-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Aucun rechargement</Text>
            <Text style={styles.emptySub}>Vos rechargements Wave, Orange Money, etc. apparaîtront ici</Text>
            <TouchableOpacity style={styles.btnRecharge} onPress={() => navigation.navigate('Recharge')}>
              <Text style={styles.btnRechargeText}>Recharger maintenant</Text>
            </TouchableOpacity>
          </View>
        ) : (
          data.map((item, index) => {
            const status = getStatusStyle(item.statut || item.etat);
            const isWave = (item.methode||"").toLowerCase().includes('wave');
            return (
              <TouchableOpacity 
                key={item.id || index} 
                style={styles.card} 
                activeOpacity={0.8}
                onPress={() => openDetail(item)}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.iconBox, {backgroundColor: isWave ? '#E0F2FF' : BLEU+'15'}]}>
                    <Ionicons name={isWave ? 'phone-portrait' : 'business'} size={18} color={isWave ? '#1E90FF' : BLEU} />
                  </View>
                  <View style={{flex:1, marginLeft:12}}>
                    <Text style={styles.methode}>{item.methode || 'Rechargement'} • {formatMoney(item.montant)} FCFA</Text>
                    <Text style={styles.date}>{item.date_rechargement || item.created_at}</Text>
                  </View>
                  <View style={[styles.badge, {backgroundColor: status.bg}]}>
                    <Ionicons name={status.icon} size={12} color={status.color} />
                    <Text style={[styles.badgeText, {color: status.color}]}>{status.label}</Text>
                  </View>
                </View>
                <View style={styles.cardBottom}>
                  <Text style={styles.ref}>Réf: {item.reference || item.id}</Text>
                  <View style={styles.voirBtn}>
                    <Text style={styles.voir}>Voir détails</Text>
                    <Ionicons name="chevron-forward" size={14} color={BLEU} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* MODAL DETAIL */}
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={()=>setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={()=>setShowModal(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Détail rechargement</Text>
              <TouchableOpacity onPress={()=>setShowModal(false)} style={styles.modalClose}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selected && (() => {
              const status = getStatusStyle(selected.statut || selected.etat);
              const isSuccess = status.label === 'Réussi';
              return (
                <>
                  <View style={[styles.modalIcon, {backgroundColor: isSuccess ? '#DCFCE7' : status.bg}]}>
                    <Ionicons name={isSuccess ? 'checkmark' : status.icon} size={32} color={status.color} />
                  </View>

                  <Text style={styles.modalMontant}>{formatMoney(selected.montant)} FCFA</Text>
                  <View style={[styles.modalBadge, {backgroundColor: status.bg}]}>
                    <Text style={[styles.modalBadgeText, {color: status.color}]}>{status.label}</Text>
                  </View>

                  <View style={styles.detailList}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Référence</Text>
                      <Text style={styles.detailValue}>{selected.reference || selected.id}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Méthode</Text>
                      <View style={styles.methodTag}>
                        <Ionicons name={selected.methode?.toLowerCase().includes('wave') ? 'phone-portrait' : 'business'} size={14} color={BLEU} />
                        <Text style={styles.methodTagText}>{selected.methode}</Text>
                      </View>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Date</Text>
                      <Text style={styles.detailValue}>{selected.date_rechargement || selected.created_at}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Matricule</Text>
                      <Text style={styles.detailValue}>{user?.matricule}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Montant</Text>
                      <Text style={[styles.detailValue, {fontWeight:'900', color:'#0F172A'}]}>{formatMoney(selected.montant)} FCFA</Text>
                    </View>
                    <View style={[styles.detailRow, {borderBottomWidth:0}]}>
                      <Text style={styles.detailLabel}>Statut</Text>
                      <Text style={[styles.detailValue, {color: status.color, fontWeight:'800'}]}>{selected.statut || selected.etat}</Text>
                    </View>
                  </View>

                  <View style={styles.infoBox}>
                    <Ionicons name="information-circle" size={16} color={BLEU} />
                    <Text style={styles.infoText}>
                      {isSuccess 
                        ? "Le montant a été crédité sur votre compte locataire (solde_compte)."
                        : status.label === 'En attente'
                        ? "Votre rechargement est en cours de traitement. Patientez quelques instants."
                        : "Ce rechargement a échoué. Aucun montant n'a été débité. Veuillez réessayer."}
                    </Text>
                  </View>

                  <TouchableOpacity style={styles.btnClose} onPress={()=>setShowModal(false)}>
                    <Text style={styles.btnCloseText}>Fermer</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{flex:1, backgroundColor:'#F8FAFC'},
  loading:{flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#F8FAFC'},
  header:{flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:'white', paddingTop:50, paddingBottom:14, paddingHorizontal:16, borderBottomWidth:1, borderBottomColor:'#F1F5F9'},
  backBtn:{width:40, height:40, borderRadius:12, backgroundColor:'#EFF6FF', justifyContent:'center', alignItems:'center'},
  headerTitle:{fontSize:15, fontWeight:'800', color:'#0F172A'},
  emptyBox:{alignItems:'center', marginTop:80, padding:20},
  emptyTitle:{fontSize:16, fontWeight:'800', color:'#0F172A', marginTop:14},
  emptySub:{fontSize:12, color:'#64748B', textAlign:'center', marginTop:6, lineHeight:18},
  btnRecharge:{backgroundColor:BLEU, paddingHorizontal:20, paddingVertical:12, borderRadius:12, marginTop:16},
  btnRechargeText:{color:'white', fontWeight:'800', fontSize:13},
  card:{backgroundColor:'white', borderRadius:16, padding:14, marginBottom:12, borderWidth:1, borderColor:'#F1F5F9', elevation:1},
  cardTop:{flexDirection:'row', alignItems:'center'},
  iconBox:{width:42, height:42, borderRadius:12, justifyContent:'center', alignItems:'center'},
  methode:{fontSize:13, fontWeight:'800', color:'#0F172A'},
  date:{fontSize:11, color:'#64748B', marginTop:3},
  badge:{flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:8, paddingVertical:4, borderRadius:20},
  badgeText:{fontSize:10, fontWeight:'800', marginLeft:2},
  cardBottom:{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginTop:12, paddingTop:10, borderTopWidth:1, borderTopColor:'#F8FAFC'},
  ref:{fontSize:10, color:'#94A3B8', fontWeight:'600'},
  voirBtn:{flexDirection:'row', alignItems:'center', gap:2},
  voir:{fontSize:11, color:BLEU, fontWeight:'700'},

  // MODAL
  modalOverlay:{flex:1, justifyContent:'flex-end', backgroundColor:'rgba(0,0,0,0.4)'},
  modalBackdrop:{...StyleSheet.absoluteFillObject},
  modalContent:{backgroundColor:'white', borderTopLeftRadius:24, borderTopRightRadius:24, padding:20, paddingBottom:30, maxHeight:'85%'},
  modalHandle:{width:40, height:4, backgroundColor:'#E2E8F0', borderRadius:2, alignSelf:'center', marginBottom:16},
  modalHeader:{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:20},
  modalTitle:{fontSize:16, fontWeight:'800', color:'#0F172A'},
  modalClose:{width:32, height:32, borderRadius:16, backgroundColor:'#F1F5F9', justifyContent:'center', alignItems:'center'},
  modalIcon:{width:64, height:64, borderRadius:32, justifyContent:'center', alignItems:'center', alignSelf:'center', marginBottom:12},
  modalMontant:{fontSize:28, fontWeight:'900', color:'#0F172A', textAlign:'center'},
  modalBadge:{alignSelf:'center', paddingHorizontal:12, paddingVertical:4, borderRadius:20, marginTop:8, marginBottom:16},
  modalBadgeText:{fontSize:11, fontWeight:'800'},
  detailList:{backgroundColor:'#F8FAFC', borderRadius:14, paddingHorizontal:14, marginTop:8},
  detailRow:{flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:12, borderBottomWidth:1, borderBottomColor:'#F1F5F9'},
  detailLabel:{fontSize:12, color:'#64748B', fontWeight:'600'},
  detailValue:{fontSize:12, color:'#0F172A', fontWeight:'600', maxWidth:'60%', textAlign:'right'},
  methodTag:{flexDirection:'row', alignItems:'center', gap:6, backgroundColor:'white', paddingHorizontal:8, paddingVertical:4, borderRadius:8, borderWidth:1, borderColor:'#E2E8F0'},
  methodTagText:{fontSize:11, fontWeight:'700', color:'#0F172A'},
  infoBox:{flexDirection:'row', gap:8, backgroundColor:'#EFF6FF', padding:12, borderRadius:12, marginTop:16},
  infoText:{flex:1, fontSize:11, color:'#334155', lineHeight:16},
  btnClose:{backgroundColor:'#0F172A', height:48, borderRadius:12, justifyContent:'center', alignItems:'center', marginTop:16},
  btnCloseText:{color:'white', fontWeight:'800', fontSize:14}
});