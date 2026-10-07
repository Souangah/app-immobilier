import React, { useContext } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { GlobalContext } from "../config/globaluser";

const BLEU = '#275edd';

export default function Contrat({ navigation }) {
    const { user } = useContext(GlobalContext);

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={{padding:16, paddingBottom:110}} showsVerticalScrollIndicator={false}>
                
                {/* HEADER */}
                <View style={styles.headerCard}>
                    <View style={styles.headerIcon}>
                        <Ionicons name="shield-checkmark" size={28} color="white" />
                    </View>
                    <View style={{flex:1, marginLeft:12}}>
                        <Text style={styles.headerTitle}>Mon Contrat</Text>
                        <Text style={styles.headerSub}>CONTRAT{user?.matricule ? ` • ${user.matricule}` : ''} • Actif</Text>
                    </View>
                    <View style={styles.activeDot} />
                </View>

                {/* 1 - MON BAIL */}
                <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("BailPDF")} activeOpacity={0.7}>
                    <View style={[styles.iconBox, {backgroundColor: "#EFF6FF"}]}>
                        <Ionicons name="document-text" size={22} color={BLEU} />
                    </View>
                    <View style={styles.cardCenter}>
                        <Text style={styles.cardTitle}>Mon Bail</Text>
                        <Text style={styles.cardSub}>Consulter et télécharger le contrat + annexes</Text>
                    </View>
                    <View style={styles.cardRight}>
                        <View style={[styles.badge, {backgroundColor: "#EFF6FF"}]}><Text style={[styles.badgeText, {color: BLEU}]}>PDF</Text></View>
                        <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                    </View>
                </TouchableOpacity>

                {/* 2 - ETAT DES LIEUX */}
                <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("EtatLieux")} activeOpacity={0.7}>
                    <View style={[styles.iconBox, {backgroundColor: "#F5F3FF"}]}>
                        <Ionicons name="camera" size={22} color="#8B5CF6" />
                    </View>
                    <View style={styles.cardCenter}>
                        <Text style={styles.cardTitle}>État des lieux</Text>
                        <Text style={styles.cardSub}>Entrée / Sortie (photos)</Text>
                    </View>
                    <View style={styles.cardRight}>
                        <View style={[styles.badge, {backgroundColor: "#F5F3FF"}]}><Text style={[styles.badgeText, {color: "#8B5CF6"}]}>Photos</Text></View>
                        <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                    </View>
                </TouchableOpacity>

                {/* 3 - SIGNALER DEPART */}
                <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("Preavis")} activeOpacity={0.7}>
                    <View style={[styles.iconBox, {backgroundColor: "#FEF2F2"}]}>
                        <Ionicons name="exit" size={22} color="#EF4444" />
                    </View>
                    <View style={styles.cardCenter}>
                        <Text style={styles.cardTitle}>Signaler un départ</Text>
                        <Text style={styles.cardSub}>Déposer mon préavis en ligne</Text>
                    </View>
                    <View style={styles.cardRight}>
                        <View style={[styles.badge, {backgroundColor: "#FEF2F2"}]}><Text style={[styles.badgeText, {color: "#EF4444"}]}>Préavis</Text></View>
                        <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                    </View>
                </TouchableOpacity>

                {/* 4 - RECHERCHE BIENS */}
                <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("RechercheBiens")} activeOpacity={0.7}>
                    <View style={[styles.iconBox, {backgroundColor: "#FFFBEB"}]}>
                        <Ionicons name="search" size={22} color="#F59E0B" />
                    </View>
                    <View style={styles.cardCenter}>
                        <Text style={styles.cardTitle}>Recherche de biens</Text>
                        <Text style={styles.cardSub}>Locaux vacants et pré-vacants</Text>
                    </View>
                    <View style={styles.cardRight}>
                        <View style={[styles.badge, {backgroundColor: "#FFFBEB"}]}><Text style={[styles.badgeText, {color: "#F59E0B"}]}>12 dispo</Text></View>
                        <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                    </View>
                </TouchableOpacity>

                {/* 5 - RESERVER BIEN */}
                <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("Reservation")} activeOpacity={0.7}>
                    <View style={[styles.iconBox, {backgroundColor: "#DCFCE7"}]}>
                        <Ionicons name="bookmark" size={22} color="#22C55E" />
                    </View>
                    <View style={styles.cardCenter}>
                        <Text style={styles.cardTitle}>Réserver un bien en ligne</Text>
                        <Text style={styles.cardSub}>Bloquez votre futur logement</Text>
                    </View>
                    <View style={styles.cardRight}>
                        <View style={[styles.badge, {backgroundColor: "#DCFCE7"}]}><Text style={[styles.badgeText, {color: "#22C55E"}]}>Nouveau</Text></View>
                        <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                    </View>
                </TouchableOpacity>

                <View style={styles.info}>
                    <Ionicons name="information-circle" size={16} color="#94A3B8" />
                    <Text style={styles.infoText}>Tous vos documents sont disponibles 24h/24. Pour tout départ, un préavis de 3 mois est requis.</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container:{flex:1, backgroundColor:'#F8FAFC'},
    headerCard:{
        flexDirection:'row', alignItems:'center',
        backgroundColor: BLEU,
        borderRadius:20, padding:16, marginBottom:16,
        shadowColor: BLEU, shadowOffset:{width:0,height:8}, shadowOpacity:0.3, shadowRadius:12, elevation:8
    },
    headerIcon:{width:48, height:48, borderRadius:14, backgroundColor:'rgba(255,255,255,0.2)', justifyContent:'center', alignItems:'center'},
    headerTitle:{color:'white', fontSize:16, fontWeight:'900'},
    headerSub:{color:'rgba(255,255,255,0.8)', fontSize:11, fontWeight:'600', marginTop:3},
    activeDot:{width:10, height:10, borderRadius:5, backgroundColor:'#22C55E', borderWidth:2, borderColor:'white'},
    card:{
        flexDirection:'row', alignItems:'center',
        backgroundColor:'white', borderRadius:16, padding:14,
        marginBottom:10, borderWidth:1, borderColor:'#F1F5F9',
        shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.05, shadowRadius:4, elevation:2
    },
    iconBox:{width:44, height:44, borderRadius:12, justifyContent:'center', alignItems:'center'},
    cardCenter:{flex:1, marginLeft:12},
    cardRight:{alignItems:'flex-end', gap:6},
    cardTitle:{fontSize:13, fontWeight:'800', color:'#0F172A'},
    cardSub:{fontSize:11, color:'#64748B', marginTop:3, lineHeight:14},
    badge:{paddingHorizontal:8, paddingVertical:3, borderRadius:8},
    badgeText:{fontSize:9, fontWeight:'800'},
    info:{flexDirection:'row', gap:8, backgroundColor:'white', borderRadius:12, padding:12, marginTop:10, borderWidth:1, borderColor:'#F1F5F9'},
    infoText:{flex:1, fontSize:11, color:'#64748B', lineHeight:16}
});