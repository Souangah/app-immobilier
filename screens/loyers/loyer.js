import React, { useContext, useEffect, useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, TextInput, Pressable, Alert } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { GlobalContext } from "../../config/globaluser";

const BLEU = '#275edd';
const NB_APERCU = 5;

const fmt = (n) => (parseFloat(n) || 0).toLocaleString('fr-FR');
const fmtDate = (d, long = false) => {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: long? 'long' : 'short', year: 'numeric' });
};

export default function Loyer({ navigation }) {
    const { user } = useContext(GlobalContext);
    const [loyers, setLoyers] = useState([]);
    const [filter, setFilter] = useState('tous');
    const [showAll, setShowAll] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [solde, setSolde] = useState(0);

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
    const prochain = premierImpayeIndex >= 0? loyers[premierImpayeIndex] : null;

    const historique = useMemo(
        () => loyers.filter(l => filter === 'tous'? true : getEtat(l.loyer_etat).key === filter),
        [loyers, filter]
    );
    const affiches = showAll? historique : historique.slice(0, NB_APERCU);

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

    const renderListHeader = () => {
        const st = prochain? getEtat(prochain.loyer_etat) : null;
        const montantTotal = prochain? parseFloat(prochain.montant) || 0 : 0;
        const avance = prochain? parseFloat(prochain.avance) || 0 : 0;
        const pct = montantTotal > 0? Math.min(100, Math.round((avance / montantTotal) * 100)) : 0;

        return (
            <View>
                {prochain? (
                    <View style={styles.nextCard}>
                        <View style={styles.nextTop}>
                            <View style={styles.nextIcon}>
                                <Ionicons name="home" size={20} color="white" />
                            </View>
                            <View style={{flex:1}}>
                                <Text style={styles.nextLabel} numberOfLines={1}>
                                    Loyer du mois de {prochain.mois} {prochain.annee}
                                </Text>
                                <Text style={styles.nextAmount}>
                                    {fmt(prochain.reste || prochain.montant)} <Text style={styles.nextCur}>FCFA</Text>
                                </Text>
                            </View>
                            <View style={[styles.badge, {backgroundColor: st.light}]}>
                                <Text style={[styles.badgeText, {color: st.bg}]}>{st.label}</Text>
                            </View>
                        </View>

                        <Text style={styles.nextEcheance}>
                            Échéance : {fmtDate(prochain.date_echeance, true)}
                        </Text>

                        {avance > 0 && (
                            <View style={styles.progressRow}>
                                <View style={styles.progressTrack}>
                                    <View style={[styles.progressFill, {width: `${pct}%`, backgroundColor: st.bg}]} />
                                </View>
                                <Text style={styles.progressText}>{fmt(avance)} réglés</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            activeOpacity={0.85}
                            style={styles.nextBtn}
                            onPress={() => openPayModal(prochain)}
                        >
                            <Text style={styles.nextBtnText}>Payer le loyer</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.okCard}>
                        <Ionicons name="checkmark-circle" size={26} color="#22C55E" />
                        <View style={{flex:1}}>
                            <Text style={styles.okTitle}>Vous êtes à jour</Text>
                            <Text style={styles.okSub}>Aucun loyer en attente de paiement.</Text>
                        </View>
                    </View>
                )}

                <View style={styles.histHeader}>
                    <Text style={styles.histTitle}>Historique des loyers</Text>
                    {historique.length > NB_APERCU && (
                        <TouchableOpacity
                            style={styles.voirToutRow}
                            onPress={() => setShowAll(!showAll)}
                        >
                            <Text style={styles.voirTout}>{showAll? 'Réduire' : 'Voir tout'}</Text>
                            <Ionicons name={showAll? 'chevron-up' : 'chevron-forward'} size={13} color={BLEU} />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.tabsRow}>
                    {[
                        {key:'tous', label:'Tous', count: counts.tous},
                        {key:'attente', label:'Attente', count: counts.attente, color:'#94A3B8'},
                        {key:'retard', label:'Retard', count: counts.retard, color:'#EF4444'},
                        {key:'partiel', label:'Partiel', count: counts.partiel, color:'#F59E0B'},
                        {key:'paye', label:'Soldés', count: counts.paye, color:'#22C55E'},
                    ].map(f => {
                        const active = filter === f.key;
                        const couleur = f.color || BLEU;
                        return (
                            <TouchableOpacity
                                key={f.key}
                                activeOpacity={0.85}
                                onPress={() => { setFilter(f.key); setShowAll(false); }}
                                style={[styles.tab, active && {backgroundColor: couleur, borderColor: couleur}]}
                            >
                                <Text style={[styles.tabCount, {color: active? 'white' : couleur}]}>
                                    {f.count}
                                </Text>
                                <Text style={[styles.tabLabel, active && {color: 'white'}]} numberOfLines={1}>
                                    {f.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        );
    };

    const renderItem = ({ item }) => {
        const st = getEtat(item.loyer_etat);
        const indexReel = loyers.indexOf(item);
        const isPremierImpaye = indexReel === premierImpayeIndex;
        const isBloque =!st.paye &&!isPremierImpaye;
        const expanded = expandedId === item.numero;
        const montantTotal = parseFloat(item.montant) || 0;
        const avance = parseFloat(item.avance) || 0;
        const pct = st.paye? 100 : (montantTotal > 0? Math.min(100, Math.round((avance / montantTotal) * 100)) : 0);

        return (
            <View style={[styles.row, isBloque && styles.rowBloque]}>
                <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.rowMain}
                    onPress={() => setExpandedId(expanded? null : item.numero)}
                >
                    <View style={{flex:1}}>
                        <View style={styles.rowTop}>
                            {isBloque && <Ionicons name="lock-closed" size={12} color="#94A3B8" />}
                            <Text style={[styles.rowMois, isBloque && {color:'#94A3B8'}]}>
                                {item.mois} {item.annee}
                            </Text>
                            <View style={[styles.badgeSm, {backgroundColor: st.light}]}>
                                <Text style={[styles.badgeSmText, {color: st.bg}]}>{st.label}</Text>
                            </View>
                        </View>
                        <Text style={styles.rowDate}>
                            {st.paye? '' : 'Échéance : '}{fmtDate(item.date_echeance)}
                        </Text>
                    </View>
                    <Text style={[styles.rowAmount, isBloque && {color:'#94A3B8'}]}>
                        {fmt(item.montant)} FCFA
                    </Text>
                    <Ionicons name={expanded? 'chevron-down' : 'chevron-forward'} size={16} color="#64748B" />
                </TouchableOpacity>

                {expanded && (
                    <View style={styles.rowDetail}>
                        <View style={styles.progressRow}>
                            <View style={styles.progressTrack}>
                                <View style={[styles.progressFill, {width: `${pct}%`, backgroundColor: st.bg}]} />
                            </View>
                            <Text style={styles.progressText}>{pct}%</Text>
                        </View>

                        <View style={styles.detailsBox}>
                            <View style={styles.detailCol}>
                                <Text style={styles.label}>Montant</Text>
                                <Text style={styles.value}>{fmt(item.montant)}</Text>
                            </View>
                            <View style={styles.detailSep} />
                            <View style={styles.detailCol}>
                                <Text style={styles.label}>Avance</Text>
                                <Text style={[styles.value, {color:'#22C55E'}]}>{fmt(item.avance)}</Text>
                            </View>
                            <View style={styles.detailSep} />
                            <View style={styles.detailCol}>
                                <Text style={styles.label}>Reste</Text>
                                <Text style={[styles.value, {color: st.paye? '#22C55E' : st.bg}]}>
                                    {fmt(item.reste)}
                                </Text>
                            </View>
                        </View>

                        {st.paye? (
                            <View style={styles.payedBox}>
                                <Ionicons name="checkmark-done" size={14} color="#16A34A" />
                                <Text style={styles.payedText}>Loyer soldé</Text>
                            </View>
                        ) : isPremierImpaye? (
                            <TouchableOpacity
                                activeOpacity={0.85}
                                style={styles.payBtn}
                                onPress={() => openPayModal(item)}
                            >
                                <Ionicons name="wallet" size={15} color="white" />
                                <Text style={styles.payBtnText}>
                                    Payer {fmt(item.reste || item.montant)} FCFA
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.blockedBox}>
                                <Ionicons name="information-circle" size={14} color="#94A3B8" />
                                <Text style={styles.blockedText}>
                                    Payez d'abord {loyers[premierImpayeIndex]?.mois} {loyers[premierImpayeIndex]?.annee}
                                </Text>
                            </View>
                        )}
                    </View>
                )}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color={BLEU} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={affiches}
                keyExtractor={(item) => String(item.numero)}
                renderItem={renderItem}
                ListHeaderComponent={renderListHeader()}
                ListEmptyComponent={<Text style={styles.empty}>Aucun loyer dans cette catégorie.</Text>}
                contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingTop: 10,
                    paddingBottom: 20
                }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BLEU]} />}
            />

            <Modal visible={showPayModal} transparent animationType="slide" onRequestClose={()=>setShowPayModal(false)}>
                <View style={styles.modalOverlay}>
                    <Pressable style={styles.backdrop} onPress={()=>setShowPayModal(false)} />
                    <View style={styles.modalContent}>
                        <View style={styles.handle} />
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Payer loyer</Text>
                            <TouchableOpacity onPress={()=>setShowPayModal(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={18} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        {selectedLoyer && (
                            <>
                                <View style={styles.modalInfo}>
                                    <Text style={styles.modalMois}>
                                        {selectedLoyer.mois} {selectedLoyer.annee} - {selectedLoyer.local_intitule}
                                    </Text>
                                    <Text style={styles.modalReste}>
                                        Reste à payer: {parseInt(selectedLoyer.reste||0).toLocaleString()} FCFA
                                    </Text>
                                    <Text style={styles.modalSolde}>
                                        Solde disponible: {solde.toLocaleString()} FCFA
                                    </Text>
                                </View>

                                <Text style={styles.labelInput}>Montant à payer (FCFA)</Text>
                                <View style={styles.inputBox}>
                                    <TextInput
                                        value={montant}
                                        onChangeText={setMontant}
                                        keyboardType="numeric"
                                        style={styles.input}
                                        placeholder="Ex: 50000"
                                        placeholderTextColor="#94A3B8"
                                    />
                                    <Text style={styles.devise}>FCFA</Text>
                                </View>

                                <View style={styles.quickRow}>
                                    {["5000","10000","20000", selectedLoyer.reste?.toString()].filter(Boolean).map(q=>(
                                        <TouchableOpacity
                                            key={q}
                                            style={[styles.quickBtn, montant===q && {backgroundColor:BLEU}]}
                                            onPress={()=>setMontant(q)}
                                        >
                                            <Text style={[styles.quickText, montant===q && {color:'white'}]}>
                                                {q===""+selectedLoyer.reste? "Total" : q}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <TouchableOpacity
                                    style={[styles.btnValider, paying && {opacity:0.6}]}
                                    onPress={handleValiderPaiement}
                                    disabled={paying}
                                >
                                    {paying? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <>
                                            <Ionicons name="checkmark-circle" size={18} color="white" />
                                            <Text style={styles.btnValiderText}>Valider le paiement</Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                {parseFloat(montant.replace(/\D/g,"")) > solde && (
                                    <View style={styles.alertSolde}>
                                        <Ionicons name="warning" size={14} color="#DC2626" />
                                        <Text style={styles.alertText}>Solde insuffisant, rechargez votre compte</Text>
                                    </View>
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
    container: {
        flex: 1,
        backgroundColor: '#F6F8FC'
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F6F8FC'
    },
    empty: {
        textAlign: 'center',
        color: '#94A3B8',
        fontSize: 12,
        marginTop: 20
    },

    // Prochain loyer
    nextCard: {
        backgroundColor: 'white',
        borderRadius: 18,
        padding: 14,
        elevation: 3
    },
    nextTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    nextIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: BLEU,
        justifyContent: 'center',
        alignItems: 'center'
    },
    nextLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#334155'
    },
    nextAmount: {
        fontSize: 22,
        fontWeight: '900',
        color: '#0F172A',
        marginTop: 1
    },
    nextCur: {
        fontSize: 12,
        fontWeight: '800'
    },
    nextEcheance: {
        fontSize: 11.5,
        color: '#64748B',
        marginTop: 8
    },
    nextBtn: {
        backgroundColor: BLEU,
        height: 42,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12
    },
    nextBtnText: {
        color: 'white',
        fontWeight: '800',
        fontSize: 13.5
    },
    okCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#F0FDF4',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: '#BBF7D0'
    },
    okTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#166534'
    },
    okSub: {
        fontSize: 11.5,
        color: '#16A34A',
        marginTop: 1
    },
    badge: {
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 10
    },
    badgeText: {
        fontSize: 10.5,
        fontWeight: '800'
    },
    badgeSm: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        marginLeft: 4
    },
    badgeSmText: {
        fontSize: 9.5,
        fontWeight: '800'
    },

    // Historique
    histHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 18,
        marginBottom: 8
    },
    histTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0F172A'
    },
    voirToutRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2
    },
    voirTout: {
        fontSize: 12,
        fontWeight: '700',
        color: BLEU
    },
    tabsRow: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 10
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 14,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E2E8F0'
    },
    tabCount: {
        fontSize: 16,
        fontWeight: '900'
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748B',
        marginTop: 1
    },
    row: {
        backgroundColor: 'white',
        borderRadius: 14,
        marginBottom: 8,
        elevation: 1,
        overflow: 'hidden'
    },
    rowBloque: {
        backgroundColor: '#FAFBFD'
    },
    rowMain: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12
    },
    rowTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    rowMois: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0F172A'
    },
    rowDate: {
        fontSize: 10.5,
        color: '#94A3B8',
        marginTop: 3
    },
    rowAmount: {
        fontSize: 12.5,
        fontWeight: '800',
        color: '#0F172A'
    },
    rowDetail: {
        paddingHorizontal: 12,
        paddingBottom: 12
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 10
    },
    progressTrack: {
        flex: 1,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#F1F5F9',
        overflow: 'hidden'
    },
    progressFill: {
        height: 6,
        borderRadius: 3
    },
    progressText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#64748B'
    },
    detailsBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        paddingVertical: 8,
        marginTop: 10
    },
    detailCol: {
        flex: 1,
        alignItems: 'center'
    },
    detailSep: {
        width: 1,
        height: 24,
        backgroundColor: '#E2E8F0'
    },
    label: {
        fontSize: 9.5,
        color: '#94A3B8',
        fontWeight: '700',
        textTransform: 'uppercase'
    },
    value: {
        fontSize: 12.5,
        fontWeight: '800',
        color: '#0F172A',
        marginTop: 2
    },
    payBtn: {
        flexDirection: 'row',
        height: 40,
        borderRadius: 12,
        backgroundColor: BLEU,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        marginTop: 10
    },
    payBtnText: {
        color: 'white',
        fontWeight: '800',
        fontSize: 12.5
    },
    payedBox: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#DCFCE7',
        height: 32,
        borderRadius: 10,
        marginTop: 10
    },
    payedText: {
        color: '#16A34A',
        fontWeight: '800',
        fontSize: 12
    },
    blockedBox: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F1F5F9',
        height: 32,
        borderRadius: 10,
        marginTop: 10
    },
    blockedText: {
        color: '#94A3B8',
        fontWeight: '600',
        fontSize: 10
    },

    // Modal
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.4)'
    },
    backdrop: {
       ...StyleSheet.absoluteFillObject
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingBottom: 30
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#E2E8F0',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A'
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalInfo: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 12,
        marginTop: 14
    },
    modalMois: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0F172A'
    },
    modalReste: {
        fontSize: 12,
        color: '#EF4444',
        fontWeight: '700',
        marginTop: 4
    },
    modalSolde: {
        fontSize: 12,
        color: '#22C55E',
        fontWeight: '700',
        marginTop: 2
    },
    labelInput: {
        fontSize: 12,
        fontWeight: '700',
        color: '#334155',
        marginTop: 16,
        marginBottom: 6
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 14,
        height: 54
    },
    input: {
        flex: 1,
        fontSize: 20,
        fontWeight: '900',
        color: '#0F172A'
    },
    devise: {
        fontSize: 12,
        fontWeight: '800',
        color: '#94A3B8'
    },
    quickRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12
    },
    quickBtn: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8
    },
    quickText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#334155'
    },
    btnValider: {
        backgroundColor: BLEU,
        height: 50,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: 18
    },
    btnValiderText: {
        color: 'white',
        fontWeight: '800',
        fontSize: 14
    },
    alertSolde: {
        flexDirection: 'row',
        gap: 6,
        backgroundColor: '#FEF2F2',
        padding: 10,
        borderRadius: 10,
        marginTop: 12,
        alignItems: 'center'
    },
    alertText: {
        fontSize: 11,
        color: '#DC2626',
        fontWeight: '600'
    }
});