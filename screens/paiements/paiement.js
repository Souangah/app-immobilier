import React, { useContext, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, Linking } from "react-native";
import * as WebBrowser from 'expo-web-browser';
import { GlobalContext } from "../../config/globaluser";
import { Ionicons } from '@expo/vector-icons';

const BLEU = '#275edd';

export default function Paiement({ route, navigation }) {
    const { user } = useContext(GlobalContext);
    const loyer = route.params?.loyer;

    const idLoyer = loyer?.numero || loyer?.id_loyer || loyer?.id;
    const [montant, setMontant] = useState(loyer?.reste?.toString() || loyer?.montant?.toString() || "");
    const [loading, setLoading] = useState(false);

    const payer = async () => {
        if (!idLoyer) return Alert.alert("Erreur", "ID loyer manquant: " + JSON.stringify(loyer));
        if (!montant || parseFloat(montant) <= 0) return Alert.alert("Erreur", "Montant invalide");
        
        setLoading(true);
        try {
            const res = await fetch('https://sidneyespace.net/paiement/paiement.php', {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({
                    matricule: user.matricule,
                    id_loyer: idLoyer,
                    montant: parseFloat(montant)
                })
            });
            const json = await res.json();
            console.log("REPONSE PAYER:", json);

            if (json.success && json.wave_launch_url) {
                // CORRECTION: On ouvre direct sans canOpenURL
                // Ça ouvre Chrome/Safari, qui va rediriger vers l'app Wave
                const result = await WebBrowser.openBrowserAsync(json.wave_launch_url);
                console.log("Browser result:", result);

                // Option 2 si WebBrowser ne marche pas, décommente :
                // await Linking.openURL(json.wave_launch_url);

            } else {
                Alert.alert("Erreur", json.message || "Erreur Wave: " + JSON.stringify(json));
            }
        } catch(e) {
            console.log(e);
            Alert.alert("Erreur", e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.label}>Loyer à payer</Text>
                <Text style={styles.mois}>{loyer?.mois} {loyer?.annee} - {loyer?.local_intitule || ''}</Text>
                <Text style={styles.montantTotal}>{parseInt(loyer?.montant||0).toLocaleString()} FCFA</Text>
                <Text style={styles.reste}>Reste: {loyer?.reste} FCFA | ID: {idLoyer}</Text>
                
                <Text style={[styles.label, {marginTop:20}]}>Montant à payer</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={montant} onChangeText={setMontant} />
                
                <TouchableOpacity style={styles.btn} onPress={payer} disabled={loading}>
                    {loading ? <ActivityIndicator color="white"/> : <>
                        <Text style={styles.btnText}>Payer avec Wave</Text>
                        <Ionicons name="wallet" size={20} color="white"/>
                    </>}
                </TouchableOpacity>

                <Text style={{marginTop:15, fontSize:10, color:'#94A3B8', textAlign:'center'}}>
                    Tu seras redirigé vers Wave pour confirmer
                </Text>
            </View>
        </View>
    );
}
const styles = StyleSheet.create({
    container:{flex:1, backgroundColor:'#F8FAFC', padding:16, justifyContent:'center'},
    card:{backgroundColor:'white', borderRadius:20, padding:20, elevation:3},
    label:{fontSize:11, fontWeight:'700', color:'#94A3B8', textTransform:'uppercase'},
    mois:{fontSize:16, fontWeight:'800', marginTop:6},
    montantTotal:{fontSize:28, fontWeight:'900', color:BLEU, marginTop:10},
    reste:{fontSize:12, color:'#64748B', marginTop:6},
    input:{borderWidth:1, borderColor:'#E2E8F0', borderRadius:12, height:50, paddingHorizontal:14, marginTop:10, fontSize:16, fontWeight:'700'},
    btn:{backgroundColor:BLEU, height:50, borderRadius:14, flexDirection:'row', justifyContent:'center', alignItems:'center', gap:8, marginTop:20},
    btnText:{color:'white', fontWeight:'800'}
});