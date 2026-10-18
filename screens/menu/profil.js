import React, { useContext } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { GlobalContext } from "../../config/globaluser";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BLEU = '#275edd';

/* Composants déclarés hors de l'écran pour ne pas être recréés à chaque rendu */
const Section = ({ title, children }) => (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionBox}>{children}</View>
    </View>
);

const Item = ({ icon, color, light, title, subtitle, badge, onPress }) => (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.iconBox, {backgroundColor: light}]}>
            <Ionicons name={icon} size={18} color={color} />
        </View>
        <View style={{flex:1, marginLeft:12}}>
            <Text style={styles.itemTitle}>{title}</Text>
            {subtitle ? <Text style={styles.itemSub}>{subtitle}</Text> : null}
        </View>
        {badge ? <View style={[styles.badge, {backgroundColor: light}]}><Text style={[styles.badgeText, {color}]}>{badge}</Text></View> : null}
        <Ionicons name="chevron-forward" size={16} color="#94A3B8" style={{marginLeft:8}} />
    </TouchableOpacity>
);

const Separator = () => <View style={styles.separator} />;

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

    return (
        <View style={styles.container}>
            {/* Le header (salutation + logement) est fourni par la barre d'onglets */}
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* ===== CARTE PROFIL ===== */}
                <TouchableOpacity style={styles.profileCard} activeOpacity={0.8} onPress={() => navigation.navigate('EditProfil')}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{(user?.nom_prenom?.charAt(0) || 'L').toUpperCase()}</Text>
                    </View>
                    <View style={{flex:1, marginLeft:12}}>
                        <Text style={styles.name} numberOfLines={1}>{user?.nom_prenom || 'Locataire'}</Text>
                        <Text style={styles.role}>Locataire</Text>
                        <Text style={styles.matricule}>Matricule : {user?.matricule}</Text>
                    </View>
                    <View style={styles.editBtn}>
                        <Ionicons name="pencil" size={15} color={BLEU} />
                    </View>
                </TouchableOpacity>

                <Section title="Mon compte">
                    <Item icon="wallet" color={BLEU} light="#EFF6FF" title="Recharger mon compte" subtitle="Wave, Orange Money, MTN, Moov" onPress={() => navigation.navigate('Recharge', { matricule: user?.matricule })} />
                    <Separator />
                    <Item icon="time" color="#0EA5E9" light="#E0F2FE" title="Historique rechargement" subtitle="Voir tous mes rechargements" onPress={() => navigation.navigate('HistoriqueRechargement')} />
                </Section>

                <Section title="Paiements & documents">
                    <Item icon="receipt" color={BLEU} light="#EFF6FF" title="Historique de paiement" 
                    subtitle="Quittances et reçus PDF" 
                    onPress={() => navigation.navigate('HistoriquePaiement')} />
                    <Separator />
                    <Item icon="calendar" color="#8B5CF6" light="#F5F3FF" 
                    title="Demander un report d'échéance" subtitle="Formulaire + conditions" 
                    badge="Report" onPress={() => navigation.navigate('ReportLoyer')} />
                    <Separator />
                    
                </Section>

                <Section title="Assistance & réclamations">
                    <Item icon="construct" color="#F59E0B" light="#FFFBEB" title="Faire une réclamation" subtitle="Plomberie, Électricité, Sécurité..." onPress={() => navigation.navigate('SplashScreen')} />
                    <Separator />
                    <Item icon="hourglass" color="#06B6D4" light="#ECFEFF" title="Suivre mes réclamations" subtitle="En attente / En cours / Clôturée" onPress={() => navigation.navigate('MesReclamations')} />
                </Section>

                <Section title="Informations">
                    <Item icon="help-circle" color="#6366F1" light="#EEF2FF" title="FAQ locataire" subtitle="Règlement intérieur" onPress={() => navigation.navigate('FAQReglement')} />
                    <Separator />
                    <Item icon="call" color="#10B981" light="#D1FAE5" title="Contacts utiles" subtitle="Gérance, Comptabilité, Technique" onPress={() => navigation.navigate('Contacts')} />
                </Section>

                {/* ===== DÉCONNEXION ===== */}
                <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.8} onPress={deconnecter}>
                    <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                    <Text style={styles.logoutText}>Se déconnecter</Text>
                </TouchableOpacity>
                <Text style={styles.version}>SIDNEY ESPACE IMMOBILIER v1.0.0</Text>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container:{flex:1, backgroundColor:'#F6F8FC'},
    content:{paddingHorizontal:16, paddingTop:10, paddingBottom:20},

    profileCard:{flexDirection:'row', alignItems:'center', backgroundColor:'white', borderRadius:16, padding:12, elevation:2, shadowColor:'#0F172A', shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:6},
    avatar:{width:46, height:46, borderRadius:23, backgroundColor:BLEU, justifyContent:'center', alignItems:'center'},
    avatarText:{color:'white', fontWeight:'900', fontSize:18},
    name:{fontSize:14, fontWeight:'800', color:'#0F172A'},
    role:{fontSize:11.5, color:'#334155', marginTop:1, fontWeight:'600'},
    matricule:{fontSize:10.5, color:'#64748B', marginTop:1, fontWeight:'500'},
    editBtn:{width:34, height:34, borderRadius:10, backgroundColor:'#EFF6FF', justifyContent:'center', alignItems:'center'},

    section:{marginTop:16},
    sectionTitle:{fontSize:10.5, fontWeight:'800', color:'#94A3B8', textTransform:'uppercase', marginBottom:6, marginLeft:4},
    sectionBox:{backgroundColor:'white', borderRadius:16, overflow:'hidden', elevation:2, shadowColor:'#0F172A', shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:6},

    item:{flexDirection:'row', alignItems:'center', paddingVertical:11, paddingHorizontal:12},
    iconBox:{width:36, height:36, borderRadius:11, justifyContent:'center', alignItems:'center'},
    itemTitle:{fontSize:12.5, fontWeight:'700', color:'#0F172A'},
    itemSub:{fontSize:10.5, color:'#64748B', marginTop:2},
    badge:{paddingHorizontal:7, paddingVertical:3, borderRadius:7},
    badgeText:{fontSize:9, fontWeight:'800'},
    separator:{height:1, backgroundColor:'#F1F5F9', marginLeft:60},

    logoutBtn:{flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, backgroundColor:'#FEF2F2', borderRadius:14, borderWidth:1, borderColor:'#FECACA', height:44, marginTop:20},
    logoutText:{color:'#EF4444', fontWeight:'800', fontSize:13},
    version:{textAlign:'center', fontSize:10, color:'#94A3B8', marginTop:12, fontWeight:'600'}
});