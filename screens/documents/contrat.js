import React, { useContext } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { GlobalContext } from "../../config/globaluser";

const BLEU = '#275edd';

// Mes documents : consultation / téléchargement
const DOCUMENTS = [
    { route: 'BailPDF',    icon: 'document-text', color: BLEU,      bg: '#EFF6FF', title: 'Mon bail',       sub: 'Contrat + annexes', badge: 'PDF' },
    { route: 'EtatLieux',  icon: 'camera',        color: '#8B5CF6', bg: '#F5F3FF', title: 'État des lieux', sub: 'Entrée / Sortie',   badge: 'Photos' },
];

// Mes démarches : actions à effectuer
const DEMARCHES = [
    { route: 'Preavis',        icon: 'exit',     color: '#EF4444', bg: '#FEF2F2', title: 'Signaler un départ',       sub: 'Déposer mon préavis en ligne',  badge: 'Préavis' },
    { route: 'Reservation',    icon: 'bookmark', color: '#22C55E', bg: '#DCFCE7', title: 'Réserver un bien en ligne', sub: 'Bloquez votre futur logement', badge: 'Nouveau' },
    { route: 'RechercheBiens', icon: 'search',   color: '#F59E0B', bg: '#FFFBEB', title: 'Recherche de biens',        sub: 'Locaux vacants et pré-vacants', badge: '12 dispo' },
];

export default function Contrat({ navigation }) {
    const { user } = useContext(GlobalContext);

    return (
        <View style={styles.container}>
            {/* Le header (salutation + logement) est fourni par la barre d'onglets */}
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* ===== 1. RÉSUMÉ DU CONTRAT ===== */}
                <View style={styles.summary}>
                    <View style={styles.summaryIcon}>
                        <Ionicons name="shield-checkmark" size={22} color="white" />
                    </View>
                    <View style={{flex:1}}>
                        <Text style={styles.summaryTitle}>Mon contrat</Text>
                        <Text style={styles.summarySub}>{user?.matricule ? `Réf. ${user.matricule}` : 'Contrat de location'}</Text>
                    </View>
                    <View style={styles.activeBadge}>
                        <View style={styles.activeDot} />
                        <Text style={styles.activeText}>Actif</Text>
                    </View>
                </View>

                {/* ===== 2. MES DOCUMENTS (grille 2 colonnes) ===== */}
                <Text style={styles.sectionTitle}>Mes documents</Text>
                <View style={styles.grid}>
                    {DOCUMENTS.map(d => (
                        <TouchableOpacity key={d.route} style={styles.tile} activeOpacity={0.8} onPress={() => navigation.navigate(d.route)}>
                            <View style={styles.tileTop}>
                                <View style={[styles.iconBox, {backgroundColor: d.bg}]}>
                                    <Ionicons name={d.icon} size={22} color={d.color} />
                                </View>
                                <View style={[styles.badge, {backgroundColor: d.bg}]}>
                                    <Text style={[styles.badgeText, {color: d.color}]}>{d.badge}</Text>
                                </View>
                            </View>
                            <Text style={styles.tileTitle}>{d.title}</Text>
                            <Text style={styles.tileSub}>{d.sub}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* ===== 3. MES DÉMARCHES (liste) ===== */}
                <Text style={styles.sectionTitle}>Mes démarches</Text>
                <View style={styles.list}>
                    {DEMARCHES.map((d, i) => (
                        <TouchableOpacity
                            key={d.route}
                            style={[styles.row, i < DEMARCHES.length - 1 && styles.rowBorder]}
                            activeOpacity={0.7}
                            onPress={() => navigation.navigate(d.route)}
                        >
                            <View style={[styles.iconBoxSm, {backgroundColor: d.bg}]}>
                                <Ionicons name={d.icon} size={19} color={d.color} />
                            </View>
                            <View style={{flex:1, marginLeft:12}}>
                                <Text style={styles.rowTitle}>{d.title}</Text>
                                <Text style={styles.rowSub}>{d.sub}</Text>
                            </View>
                            <View style={[styles.badge, {backgroundColor: d.bg, marginRight:6}]}>
                                <Text style={[styles.badgeText, {color: d.color}]}>{d.badge}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* ===== 4. NOTE ===== */}
                <View style={styles.info}>
                    <Ionicons name="information-circle" size={16} color={BLEU} />
                    <Text style={styles.infoText}>Tous vos documents sont disponibles 24h/24. Pour tout départ, un préavis de 3 mois est requis.</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container:{flex:1, backgroundColor:'#F6F8FC'},
    content:{paddingHorizontal:16, paddingTop:10, paddingBottom:20},

    /* Résumé */
    summary:{flexDirection:'row', alignItems:'center', gap:12, backgroundColor:'#E8F0FF', borderRadius:16, padding:12},
    summaryIcon:{width:42, height:42, borderRadius:13, backgroundColor:BLEU, justifyContent:'center', alignItems:'center'},
    summaryTitle:{fontSize:14, fontWeight:'800', color:'#0F172A'},
    summarySub:{fontSize:11, color:'#64748B', marginTop:2, fontWeight:'600'},
    activeBadge:{flexDirection:'row', alignItems:'center', gap:5, backgroundColor:'#DCFCE7', paddingHorizontal:9, paddingVertical:4, borderRadius:10},
    activeDot:{width:7, height:7, borderRadius:4, backgroundColor:'#22C55E'},
    activeText:{fontSize:10.5, fontWeight:'800', color:'#16A34A'},

    sectionTitle:{fontSize:15, fontWeight:'800', color:'#0F172A', marginTop:18, marginBottom:8},

    /* Grille documents */
    grid:{flexDirection:'row', gap:10},
    tile:{flex:1, backgroundColor:'white', borderRadius:16, padding:12, elevation:2, shadowColor:'#0F172A', shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:6},
    tileTop:{flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start'},
    iconBox:{width:44, height:44, borderRadius:14, justifyContent:'center', alignItems:'center'},
    tileTitle:{fontSize:13, fontWeight:'800', color:'#0F172A', marginTop:10},
    tileSub:{fontSize:10.5, color:'#64748B', marginTop:2},

    /* Liste démarches */
    list:{backgroundColor:'white', borderRadius:16, elevation:2, shadowColor:'#0F172A', shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:6, overflow:'hidden'},
    row:{flexDirection:'row', alignItems:'center', padding:12},
    rowBorder:{borderBottomWidth:1, borderBottomColor:'#F1F5F9'},
    iconBoxSm:{width:38, height:38, borderRadius:12, justifyContent:'center', alignItems:'center'},
    rowTitle:{fontSize:12.5, fontWeight:'800', color:'#0F172A'},
    rowSub:{fontSize:10.5, color:'#64748B', marginTop:2},

    badge:{paddingHorizontal:8, paddingVertical:3, borderRadius:8},
    badgeText:{fontSize:9.5, fontWeight:'800'},

    info:{flexDirection:'row', gap:8, backgroundColor:'#EFF6FF', borderRadius:12, padding:10, marginTop:16},
    infoText:{flex:1, fontSize:10.5, color:'#475569', lineHeight:15}
});