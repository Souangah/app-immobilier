import React, { useContext, useEffect, useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, TextInput, Pressable, Alert } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { GlobalContext } from "../../config/globaluser";

const BLEU = '#275edd';

export default function Loyer({ navigation }) {
    const { user } = useContext(GlobalContext);
    const [loyers, setLoyers] = useState([]);
    const [filter, setFilter] = useState('tous');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [solde, setSolde] = useState(0);

    // MODAL PAIEMENT
    const [showPayModal, setShowPayModal] = useState(false);
    const [selectedLoyer, setSelectedLoyer] = useState(null);
    const [montant, setMontant] = useState("");
    const [paying, setPaying] = useState(false);

    const fetchLoyers = async () => {
        try {
            const res = await fetch(`https://sidneyespace.net/paiement/info-loyer.php?matricule=${user?.matricule}`);
            const json = await res.json();
            if (json.success) {
                const norm = (json.loyers || []).map(l => ({
                 ...l,
                    numero: l.numero || l.loyer_numero || l.id_loyer || l.id,
                    timestamp: new Date(l.date_echeance).getTime() || 0
                }));
                norm.sort((a,b) => a.timestamp - b.timestamp);
                setLoyers(norm);
                if(json.solde!== undefined) setSolde(parseFloat(json.solde));
                else if(json.loyers[0]?.solde_compte) setSolde(parseFloat(json.loyers[0].solde_compte));
            }
        } catch(e) { console.log(e); }
        finally { setLoading(false); setRefreshing(false); }
    };

    const fetchSolde = async () => {
        try{
            const res = await fetch(`https://sidneyespace.net/paiement/get-solde.php?matricule=${user?.matricule}`);
            const json = await res.json();
            if(json.success) setSolde(parseFloat(json.solde));
        }catch(e){}
    };

    useEffect(() => { fetchLoyers(); fetchSolde(); }, []);
    const onRefresh = useCallback(() => { setRefreshing(true); fetchLoyers(); fetchSolde(); }, []);

    const getEtat = (etat) => {
        const e = (etat||'').toLowerCase();
        if (e.includes('payé') || e.includes('paye')) return { bg:'#22C55E', light:'#DCFCE7', icon:'checkmark-circle', label:'Payé', key:'paye', paye: true };
        if (e.includes('retard')) return { bg:'#EF4444', light:'#FEF2F2', icon:'alert-circle', label:'En retard', key:'retard', paye: false };
        if (e.includes('partiel')) return { bg:'#F59E0B', light:'#FFFBEB', icon:'pie-chart', label:'Partiel', key:'partiel', paye: false };
        return { bg:'#94A3B8', light:'#F1F5F9', icon:'time', label:'En attente', key:'attente', paye: false };
    };

    const counts = useMemo(() => ({
        tous: loyers.length,
        attente: loyers.filter(l => getEtat(l.loyer_etat).key === 'attente').length,
        retard: loyers.filter(l => getEtat(l.loyer_etat).key === 'retard').length,
        partiel: loyers.filter(l => getEtat(l.loyer_etat).key === 'partiel').length,
        paye: loyers.filter(l => getEtat(l.loyer_etat).key === 'paye').length,
    }), [loyers]);

    const premierImpayeIndex = loyers.findIndex(l =>!getEtat(l.loyer_etat).paye);
    const filtered = loyers.filter(l => filter === 'tous'? true : getEtat(l.loyer_etat).key === filter);

    const openPayModal = (loyer) => {
        setSelectedLoyer(loyer);
        const reste = parseInt(loyer.reste || loyer.montant) || 0;
        setMontant(reste.toString());
        setShowPayModal(true);
    };

    const handleValiderPaiement = async () => {
        const montantClean = montant.replace(/\D/g,"");
        if(!montantClean || parseInt(montantClean) < 5){
            Alert.alert("Erreur","Montant minimum 5 FCFA");
            return;
        }
        if(parseFloat(montantClean) > solde){
            Alert.alert("Solde insuffisant", `Votre solde est de ${solde.toLocaleString()} FCFA. Veuillez recharger.`, [
                {text:"Recharger", onPress:()=> { setShowPayModal(false); navigation.navigate('Recharge'); }},
                {text:"OK", style:"cancel"}
            ]);
            return;
        }

        setPaying(true);
        try{
            const res = await fetch(`https://sidneyespace.net/paiement/paiement.php`,{
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body: JSON.stringify({
                    matricule: user?.matricule,
                    id_loyer: selectedLoyer.numero,
                    montant: montantClean
                })
            });
            const json = await res.json();
            if(json.success){
                Alert.alert("Succès", `Paiement de ${parseInt(montantClean).toLocaleString()} FCFA effectué.\nNouveau solde: ${parseFloat(json.nouveau_solde).toLocaleString()} FCFA`);
                setShowPayModal(false);
                setMontant("");
                fetchLoyers();
                fetchSolde();
            }else{
                Alert.alert("Erreur", json.message || "Paiement échoué");
            }
        }catch(e){
            Alert.alert("Erreur", e.message);
        }finally{ setPaying(false); }
    };

    const renderItem = ({ item }) => {
        const st = getEtat(item.loyer_etat);
        const indexReel = loyers.indexOf(item);
        const isPremierImpaye = indexReel === premierImpayeIndex;
        const isBloque =!st.paye &&!isPremierImpaye;

        return (
            <View style={[styles.card, isBloque && styles.cardBloque]}>
                {isBloque && <View style={styles.lockOverlay}><Ionicons name="lock-closed" size={12} color="#94A3B8" /><Text style={styles.lockText}>Bloqué</Text></View>}
                <View style={styles.cardTop}>
                    <View style={[styles.icon, {backgroundColor: st.light, opacity: isBloque?0.5:1}]}>
                        <Ionicons name={isBloque? 'lock-closed' : st.icon} size={20} color={isBloque? '#94A3B8' : st.bg} />
                    </View>
                    <View style={{flex:1}}>
                        <Text style={[styles.mois, isBloque && {color:'#94A3B8'}]}>{item.mois} {item.annee} • {item.local_intitule}</Text>
                        <Text style={styles.date}>Échéance: {item.date_echeance}</Text>
                    </View>
                    <View style={[styles.badge, {backgroundColor: st.light}]}><Text style={[styles.badgeText, {color: st.bg}]}>{st.label}</Text></View>
                </View>
                <View style={styles.divider} />
                <View style={styles.details}>
                    <View><Text style={styles.label}>Montant</Text><Text style={styles.value}>{parseInt(item.montant||0).toLocaleString()} FCFA</Text></View>
                    <View><Text style={styles.label}>Avance</Text><Text style={[styles.value, {color: '#22C55E'}]}>{parseInt(item.avance||0).toLocaleString()}</Text></View>
                    <View><Text style={styles.label}>Reste</Text><Text style={[styles.value, {color: st.bg}]}>{parseInt(item.reste||0).toLocaleString()}</Text></View>
                </View>

                {st.paye? (
                    <View style={styles.payedBox}><Ionicons name="checkmark-done" size={14} color="#22C55E" /><Text style={styles.payedText}>Soldé ✓</Text></View>
                ) : isPremierImpaye? (
                    <TouchableOpacity style={[styles.payBtn, {backgroundColor: st.bg}]} onPress={() => openPayModal(item)}>
                        <Text style={styles.payBtnText}>Payer {parseInt(item.reste||item.montant).toLocaleString()} FCFA</Text>
                        <Ionicons name="wallet" size={16} color="white" />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.blockedBox}><Ionicons name="information-circle" size={14} color="#94A3B8" /><Text style={styles.blockedText}>Payez d'abord {loyers[premierImpayeIndex]?.mois} {loyers[premierImpayeIndex]?.annee}</Text></View>
                )}
            </View>
        );
    };

    if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color={BLEU} /></View>

    return (
        <View style={styles.container}>
           

            <View style={styles.infoBar}>
                <Ionicons name="alert-circle" size={14} color={BLEU} />
                <Text style={styles.infoText}>Paiement par solde, ordre chronologique obligatoire</Text>
            </View>

            <View style={styles.filters}>
                {[
                    {key:'tous', label:'Tous', count: counts.tous},
                    {key:'attente', label:'Attente', count: counts.attente, color:'#94A3B8'},
                    {key:'retard', label:'Retard', count: counts.retard, color:'#EF4444'},
                    {key:'partiel', label:'Partiel', count: counts.partiel, color:'#F59E0B'},
                    {key:'paye', label:'Soldés', count: counts.paye, color:'#22C55E'},
                ].map(f => {
                    const active = filter === f.key;
                    return (
                        <TouchableOpacity key={f.key} onPress={()=>setFilter(f.key)} style={[styles.filterBtn, active && {backgroundColor: f.color||BLEU, borderColor: f.color||BLEU}]}>
                            <Text style={[styles.filterText, active && styles.filterTextActive]}>{f.label}</Text>
                            <View style={[styles.countBadge, active? styles.countBadgeActive : {backgroundColor: f.color? f.color+'20' : '#F1F5F9'}]}><Text style={[styles.countText, active? {color:'white'} : {color: f.color||'#64748B'}]}>{f.count}</Text></View>
                        </TouchableOpacity>
                    )
                })}
            </View>

            <FlatList
                data={filtered}
                keyExtractor={(item) => item.numero}
                renderItem={renderItem}
                contentContainerStyle={{padding:16, paddingBottom:110}}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BLEU]} />}
            />

            {/* MODAL SAISIE MONTANT */}
            <Modal visible={showPayModal} transparent animationType="slide" onRequestClose={()=>setShowPayModal(false)}>
                <View style={styles.modalOverlay}>
                    <Pressable style={styles.backdrop} onPress={()=>setShowPayModal(false)} />
                    <View style={styles.modalContent}>
                        <View style={styles.handle} />
                        <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
                            <Text style={styles.modalTitle}>Payer loyer</Text>
                            <TouchableOpacity onPress={()=>setShowPayModal(false)} style={styles.closeBtn}><Ionicons name="close" size={18} color="#64748B" /></TouchableOpacity>
                        </View>

                        {selectedLoyer && (
                            <>
                                <View style={styles.modalInfo}>
                                    <Text style={styles.modalMois}>{selectedLoyer.mois} {selectedLoyer.annee} - {selectedLoyer.local_intitule}</Text>
                                    <Text style={styles.modalReste}>Reste à payer: {parseInt(selectedLoyer.reste||0).toLocaleString()} FCFA</Text>
                                    <Text style={styles.modalSolde}>Solde disponible: {solde.toLocaleString()} FCFA</Text>
                                </View>

                                <Text style={styles.labelInput}>Montant à payer (FCFA)</Text>
                                <View style={styles.inputBox}>
                                    <TextInput value={montant} onChangeText={setMontant} keyboardType="numeric" style={styles.input} placeholder="Ex: 50000" placeholderTextColor="#94A3B8" />
                                    <Text style={styles.devise}>FCFA</Text>
                                </View>

                                <View style={styles.quickRow}>
                                    {["5000","10000","20000", selectedLoyer.reste?.toString()].filter(Boolean).map(q=>(
                                        <TouchableOpacity key={q} style={[styles.quickBtn, montant===q && {backgroundColor:BLEU}]} onPress={()=>setMontant(q)}>
                                            <Text style={[styles.quickText, montant===q && {color:'white'}]}>{q===""+selectedLoyer.reste? "Total" : q}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <TouchableOpacity style={[styles.btnValider, paying && {opacity:0.6}]} onPress={handleValiderPaiement} disabled={paying}>
                                    {paying? <ActivityIndicator color="white" /> : <>
                                        <Ionicons name="checkmark-circle" size={18} color="white" />
                                        <Text style={styles.btnValiderText}>Valider le paiement</Text>
                                    </>}
                                </TouchableOpacity>

                                {parseFloat(montant.replace(/\D/g,"")) > solde && (
                                    <View style={styles.alertSolde}><Ionicons name="warning" size={14} color="#DC2626" /><Text style={styles.alertText}>Solde insuffisant, rechargez votre compte</Text></View>
                                )}
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container:{flex:1, backgroundColor:'#F8FAFC'},
    loading:{flex:1, justifyContent:'center', alignItems:'center'},
    soldeBar:{flexDirection:'row', justifyContent:'space-between', alignItems:'center', backgroundColor:'white', margin:16, marginBottom:0, padding:14, borderRadius:14, borderWidth:1, borderColor:'#F1F5F9'},
    soldeLabel:{fontSize:11, color:'#94A3B8', fontWeight:'700', textTransform:'uppercase'},
    soldeValue:{fontSize:18, fontWeight:'900', color:'#0F172A', marginTop:2},
    btnRechargeSmall:{flexDirection:'row', alignItems:'center', gap:4, backgroundColor:BLEU, paddingHorizontal:12, paddingVertical:7, borderRadius:20},
    infoBar:{flexDirection:'row', alignItems:'center', gap:6, backgroundColor:'#EFF6FF', margin:16, padding:10, borderRadius:10},
    infoText:{fontSize:11, color:BLEU, fontWeight:'600'},
    filters:{flexDirection:'row', paddingHorizontal:16, gap:8, marginBottom:10, flexWrap:'wrap'},
    filterBtn:{flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:12, paddingVertical:7, borderRadius:20, backgroundColor:'white', borderWidth:1, borderColor:'#E2E8F0'},
    filterText:{fontSize:12, fontWeight:'700', color:'#64748B'},
    filterTextActive:{color:'white'},
    countBadge:{minWidth:20, height:20, borderRadius:10, justifyContent:'center', alignItems:'center', paddingHorizontal:5},
    countBadgeActive:{backgroundColor:'rgba(255,255,255,0.3)'},
    countText:{fontSize:10, fontWeight:'800'},
    card:{backgroundColor:'white', borderRadius:18, padding:14, marginBottom:12, borderWidth:1, borderColor:'#F1F5F9', elevation:2},
    cardBloque:{opacity:0.6, backgroundColor:'#F8FAFC'},
    lockOverlay:{position:'absolute', top:10, right:10, flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'#F1F5F9', paddingHorizontal:6, paddingVertical:2, borderRadius:6, zIndex:1},
    lockText:{fontSize:9, fontWeight:'800', color:'#94A3B8'},
    cardTop:{flexDirection:'row', alignItems:'center', gap:10},
    icon:{width:40, height:40, borderRadius:12, justifyContent:'center', alignItems:'center'},
    mois:{fontSize:13, fontWeight:'800', color:'#0F172A'},
    date:{fontSize:11, color:'#94A3B8', marginTop:2},
    badge:{paddingHorizontal:8, paddingVertical:4, borderRadius:8},
    badgeText:{fontSize:10, fontWeight:'800'},
    divider:{height:1, backgroundColor:'#F1F5F9', marginVertical:12},
    details:{flexDirection:'row', justifyContent:'space-between'},
    label:{fontSize:10, color:'#94A3B8', fontWeight:'700', textTransform:'uppercase'},
    value:{fontSize:13, fontWeight:'800', color:'#0F172A', marginTop:2},
    payBtn:{flexDirection:'row', height:42, borderRadius:12, justifyContent:'center', alignItems:'center', gap:6, marginTop:12},
    payBtnText:{color:'white', fontWeight:'800', fontSize:12},
    payedBox:{flexDirection:'row', justifyContent:'center', alignItems:'center', gap:4, backgroundColor:'#DCFCE7', height:36, borderRadius:10, marginTop:12},
    payedText:{color:'#22C55E', fontWeight:'800', fontSize:12},
    blockedBox:{flexDirection:'row', justifyContent:'center', alignItems:'center', gap:4, backgroundColor:'#F1F5F9', height:36, borderRadius:10, marginTop:12},
    blockedText:{color:'#94A3B8', fontWeight:'600', fontSize:10},

    modalOverlay:{flex:1, justifyContent:'flex-end', backgroundColor:'rgba(0,0,0,0.4)'},
    backdrop:{...StyleSheet.absoluteFillObject},
    modalContent:{backgroundColor:'white', borderTopLeftRadius:24, borderTopRightRadius:24, padding:20, paddingBottom:30},
    handle:{width:40, height:4, backgroundColor:'#E2E8F0', borderRadius:2, alignSelf:'center', marginBottom:16},
    modalTitle:{fontSize:16, fontWeight:'800', color:'#0F172A'},
    closeBtn:{width:32, height:32, borderRadius:16, backgroundColor:'#F1F5F9', justifyContent:'center', alignItems:'center'},
    modalInfo:{backgroundColor:'#F8FAFC', borderRadius:12, padding:12, marginTop:14},
    modalMois:{fontSize:13, fontWeight:'800', color:'#0F172A'},
    modalReste:{fontSize:12, color:'#EF4444', fontWeight:'700', marginTop:4},
    modalSolde:{fontSize:12, color:'#22C55E', fontWeight:'700', marginTop:2},
    labelInput:{fontSize:12, fontWeight:'700', color:'#334155', marginTop:16, marginBottom:6},
    inputBox:{flexDirection:'row', alignItems:'center', backgroundColor:'#F8FAFC', borderRadius:12, borderWidth:1, borderColor:'#E2E8F0', paddingHorizontal:14, height:54},
    input:{flex:1, fontSize:20, fontWeight:'900', color:'#0F172A'},
    devise:{fontSize:12, fontWeight:'800', color:'#94A3B8'},
    quickRow:{flexDirection:'row', gap:8, marginTop:12},
    quickBtn:{backgroundColor:'#F1F5F9', paddingHorizontal:12, paddingVertical:6, borderRadius:8},
    quickText:{fontSize:12, fontWeight:'700', color:'#334155'},
    btnValider:{backgroundColor:BLEU, height:50, borderRadius:12, flexDirection:'row', justifyContent:'center', alignItems:'center', gap:8, marginTop:18},
    btnValiderText:{color:'white', fontWeight:'800', fontSize:14},
    alertSolde:{flexDirection:'row', gap:6, backgroundColor:'#FEF2F2', padding:10, borderRadius:10, marginTop:12, alignItems:'center'},
    alertText:{fontSize:11, color:'#DC2626', fontWeight:'600'}
});