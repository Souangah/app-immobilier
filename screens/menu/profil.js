import React, { useContext } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { GlobalContext } from "../../config/globaluser";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BLEU = '#275edd';

export default function Profil({ navigation }) {
    const { user, setUser } = useContext(GlobalContext);

    const deconnecter = () => {
        Alert.alert("Déconnexion", "Voulez-vous vous déconnecter ?", [
            { text: "Annuler", style: "cancel" },
            { text: "Déconnexion", style: "destructive", onPress: async () => { 
                await AsyncStorage.clear();
                setUser(null); 
                navigation.replace('Connexion'); 
            }}
        ]);
    };

    const Section = ({ title, children }) => (
        <View style={{marginTop:22}}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.sectionBox}>{children}</View>
        </View>
    );

    const Item = ({ icon, color, light, title, subtitle, badge, onPress }) => (
        <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.iconBox, {backgroundColor: light}]}>
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <View style={{flex:1, marginLeft:12}}>
                <Text style={styles.itemTitle}>{title}</Text>
                {subtitle ? <Text style={styles.itemSub}>{subtitle}</Text> : null}
            </View>
            {badge ? <View style={[styles.badge, {backgroundColor: light}]}><Text style={[styles.badgeText, {color}]}>{badge}</Text></View> : null}
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" style={{marginLeft:8}} />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={{padding:16, paddingBottom:120}} showsVerticalScrollIndicator={false}>
                
                <TouchableOpacity style={styles.header} activeOpacity={0.7} onPress={() => navigation.navigate('EditProfil')}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{(user?.nom_prenom?.charAt(0) || 'L').toUpperCase()}</Text>
                    </View>
                    <View style={{flex:1, marginLeft:12}}>
                        <Text style={styles.name}>{user?.nom_prenom || 'Locataire'}</Text>
                        <Text style={styles.matricule}>Matricule: {user?.matricule}</Text>
                    </View>
                    <View style={styles.editBtn}>
                        <Ionicons name="pencil" size={16} color={BLEU} />
                    </View>
                </TouchableOpacity>

                <Section title="Mon Compte">
                    <Item icon="wallet" color={BLEU} light="#EFF6FF" title="Recharger mon compte" subtitle="Wave, Orange Money, MTN, Moov" onPress={() => navigation.navigate('Recharge', { matricule: user?.matricule })} />
                    <View style={styles.separator} />
                    <Item icon="time" color="#0EA5E9" light="#E0F2FE" title="Historique rechargement" subtitle="Voir tous mes rechargements" onPress={() => navigation.navigate('HistoriqueRechargement')} />
                </Section>

                <Section title="Paiements & Documents">
                    <Item icon="receipt" color={BLEU} light="#EFF6FF" title="Historique de paiement" subtitle="Quittances et reçus PDF" onPress={() => navigation.navigate('HistoriquePaiement')} />
                    <View style={styles.separator} />
                    <Item icon="calendar" color="#8B5CF6" light="#F5F3FF" title="Demander un report d'échéance" subtitle="Formulaire + conditions" badge="Report" onPress={() => navigation.navigate('ReportLoyer')} />
                    <View style={styles.separator} />
                    <Item icon="ribbon" color="#22C55E" light="#DCFCE7" title="Attestations" subtitle="Attestation de loyer, domicile" badge="3 dispo" onPress={() => navigation.navigate('Attestations')} />
                </Section>

                <Section title="Assistance & Réclamations">
                    <Item icon="construct" color="#F59E0B" light="#FFFBEB" title="Faire une réclamation" subtitle="Plomberie, Électricité, Sécurité..." onPress={() => navigation.navigate('SplashScreen')} />
                    <View style={styles.separator} />
                    <Item icon="hourglass" color="#06B6D4" light="#ECFEFF" title="Suivre mes réclamations" subtitle="En attente / En cours / Clôturée" onPress={() => navigation.navigate('MesReclamations')} />
                </Section>

                <Section title="Informations">
                    <Item icon="help-circle" color="#6366F1" light="#EEF2FF" title="FAQ Locataire" subtitle="Règlement intérieur" onPress={() => navigation.navigate('FAQReglement')} />
                    <View style={styles.separator} />
                    <Item icon="call" color="#10B981" light="#D1FAE5" title="Contacts utiles" subtitle="Gérance, Comptabilité, Technique" onPress={() => navigation.navigate('Contacts')} />
                </Section>

                <TouchableOpacity style={styles.logoutBox} activeOpacity={0.7} onPress={deconnecter}>
                    <View style={styles.logoutBtn}>
                        <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                        <Text style={styles.logoutText}>Déconnexion</Text>
                    </View>
                    <Text style={styles.version}>SIDNEY ESPACE IMMOBILIER v1.0.0</Text>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container:{flex:1, backgroundColor:'#F8FAFC'},
    header:{flexDirection:'row', alignItems:'center', backgroundColor:'white', borderRadius:20, padding:16, borderWidth:1, borderColor:'#F1F5F9'},
    avatar:{width:48, height:48, borderRadius:24, backgroundColor:BLEU, justifyContent:'center', alignItems:'center'},
    avatarText:{color:'white', fontWeight:'900', fontSize:18},
    name:{fontSize:14, fontWeight:'800', color:'#0F172A'},
    matricule:{fontSize:11, color:'#64748B', marginTop:2, fontWeight:'600'},
    editBtn:{width:36, height:36, borderRadius:10, backgroundColor:'#EFF6FF', justifyContent:'center', alignItems:'center'},
    sectionTitle:{fontSize:11, fontWeight:'800', color:'#94A3B8', textTransform:'uppercase', marginBottom:8, marginLeft:4},
    sectionBox:{backgroundColor:'white', borderRadius:16, borderWidth:1, borderColor:'#F1F5F9', overflow:'hidden'},
    item:{flexDirection:'row', alignItems:'center', padding:14},
    iconBox:{width:40, height:40, borderRadius:10, justifyContent:'center', alignItems:'center'},
    itemTitle:{fontSize:13, fontWeight:'700', color:'#0F172A'},
    itemSub:{fontSize:11, color:'#64748B', marginTop:2},
    badge:{paddingHorizontal:7, paddingVertical:3, borderRadius:7},
    badgeText:{fontSize:9, fontWeight:'800'},
    separator:{height:1, backgroundColor:'#F8FAFC', marginLeft:66},
    logoutBox:{alignItems:'center', marginTop:24},
    logoutBtn:{flexDirection:'row', alignItems:'center', gap:6, backgroundColor:'white', paddingHorizontal:20, paddingVertical:10, borderRadius:20, borderWidth:1, borderColor:'#FEE2E2'},
    logoutText:{color:'#EF4444', fontWeight:'700', fontSize:13},
    version:{fontSize:10, color:'#94A3B8', marginTop:12, fontWeight:'600'}
});