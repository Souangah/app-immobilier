import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput, Alert, Linking, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlobalContext } from "../../config/globaluser";

const BLEU = '#275edd';
const NUMERO_SIDNEY = "2250700000000"; // mets ton numéro WhatsApp Sidney Espace

const METHODS = [
  { 
    id: 'sidney',
    name: 'Sidney Espace',
    logo: require('../../assets/images/sidney.png'),
    desc: 'Rechargement en agence', fee: 'Gratuit',
    available: true
  },
  { 
    id: 'wave',
    name: 'Wave',
    logo: require('../../assets/images/wave.png'),
    desc: 'Paiement instantané',
    fee: '0% frais',
    available: true 
  },
  { 
    id: 'orange',
    name: 'Orange Money',
    logo: require('../../assets/images/orange.png'),
    desc: 'Orange CI',
    fee: '1% frais',
    available: false 
  },
  { 
    id: 'mtn',
    name: 'MTN Money',
    logo: require('../../assets/images/mtn.png'),
    desc: 'MTN CI',
    fee: '1% frais',
    available: false
  },
  { 
    id: 'moov',
    name: 'Moov Money',
    logo: require('../../assets/images/moov.png'),
    desc: 'Moov CI',
    fee: '1% frais',
    available: false
  },
];

export default function Rechargement({ navigation, route }) {
  const { user } = useContext(GlobalContext);
  const matricule = route.params?.matricule || user?.matricule || user?.locataire || "";
  const [selected, setSelected] = useState(null);
  const [montant, setMontant] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    const montantClean = montant.replace(/\D/g,"");
    if(!montantClean || parseInt(montantClean) < 1){
      Alert.alert("Erreur","Montant minimum 1000 FCFA");
      return;
    }
    if(!selected) return;

    setLoading(true);
    try{
      if(selected.id === 'wave'){
        // Appel API Wave avec bindParam
        const res = await fetch("https://sidneyespace.net/paiement/rechargement.php",{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ montant: montantClean, locataire: matricule })
        });
        const json = await res.json();
        
        if(json.success && json.wave_launch_url){
          Linking.openURL(json.wave_launch_url);
        } else {
          console.log(json);
          Alert.alert("Erreur Wave", json.message || "Impossible de créer le paiement");
        }
      } else {
        // Sidney Espace -> enregistrement simple + WhatsApp
        try{
          await fetch("https://sidneyespace.net/paiement/api_rechargement_sidney.php",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify({ montant: montantClean, locataire: matricule })
          });
        }catch(e){}

        const msg = `Bonjour Sidney Espace,%0A%0AJe souhaite faire un rechargement.%0A%0AMatricule: ${matricule}%0ANom: ${user?.nom_prenom || ''}%0AMontant: ${montantClean} FCFA%0AMode: Agence%0A%0AMerci.`;
        Linking.openURL(`https://wa.me/${NUMERO_SIDNEY}?text=${msg}`);
      }
    }catch(e){
      Alert.alert("Erreur", e.message);
    }finally{
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="white" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Recharger mon compte</Text>
        <View style={{width:40}} />
      </View>

      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={20}>
        <ScrollView contentContainerStyle={{padding:20, paddingBottom:130}} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Choisissez un moyen de paiement</Text>

          {METHODS.map((m) => (
            <TouchableOpacity
              key={m.id}
              style={[styles.methodCard, !m.available && styles.disabled, selected?.id === m.id && styles.selectedCard]}
              disabled={!m.available}
              onPress={() => setSelected(m)}
              activeOpacity={0.7}
            >
              <View style={[styles.logoWrap, !m.available && {opacity:0.4}]}>
                <Image source={m.logo} style={styles.logo} resizeMode="contain" />
              </View>
              <View style={{flex:1, opacity: m.available ? 1 : 0.5}}>
                <View style={{flexDirection:'row', alignItems:'center', gap:8}}>
                  <Text style={styles.methodName}>{m.name}</Text>
                  {!m.available && <View style={styles.badgeSoon}><Text style={styles.badgeSoonText}>Bientôt</Text></View>}
                </View>
                <Text style={styles.methodDesc}>{m.desc} • {m.fee}</Text>
              </View>
              {selected?.id === m.id ? <Ionicons name="checkmark-circle" size={20} color={BLEU} /> :
               m.available ? <Ionicons name="chevron-forward" size={18} color="#CBD5E1" /> : <Ionicons name="lock-closed" size={16} color="#CBD5E1" />}
            </TouchableOpacity>
          ))}

          {selected && (
            <View style={styles.amountBox}>
              <View style={styles.amountHeader}>
                <Image source={selected.logo} style={{width:28, height:28}} resizeMode="contain" />
                <Text style={styles.amountTitle}>Recharger avec {selected.name}</Text>
                <TouchableOpacity onPress={()=>{ setSelected(null); setMontant(""); }}><Ionicons name="close" size={20} color="#64748B" /></TouchableOpacity>
              </View>

              <Text style={styles.label}>Montant (FCFA)</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 20000"
                  keyboardType="numeric"
                  value={montant}
                  onChangeText={setMontant}
                  placeholderTextColor="#94A3B8"
                  returnKeyType="done"
                />
                <Text style={styles.devise}>FCFA</Text>
              </View>

              <View style={styles.quickRow}>
                {["5000","10000","20000","50000"].map(q=>(
                  <TouchableOpacity key={q} style={[styles.quickBtn, montant===q && {backgroundColor:BLEU}]} onPress={()=>setMontant(q)}>
                    <Text style={[styles.quickText, montant===q && {color:'white'}]}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={[styles.btnPay, loading && {opacity:0.6}]} onPress={handlePay} disabled={loading}>
                <Ionicons name={selected.id==='wave'?'phone-portrait':'logo-whatsapp'} size={18} color="white" />
                <Text style={styles.btnPayText}>
                  {loading ? "Patientez..." : selected.id==='wave' ? `Payer ${montant ? montant + ' FCFA' : ''} avec Wave` : `Envoyer sur WhatsApp`}
                </Text>
              </TouchableOpacity>

              <View style={styles.infoBox}>
                <Ionicons name="shield-checkmark" size={14} color={BLEU} />
                <Text style={styles.infoText}>
                  {selected.id==='wave' ? "Vous serez redirigé vers Wave pour finaliser le paiement sécurisé." : "Votre demande sera envoyée sur WhatsApp. Présentez-vous en agence avec votre matricule."}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{flex:1, backgroundColor:'#F8FAFC'},
  top:{ backgroundColor:BLEU, paddingTop:55, paddingBottom:18, paddingHorizontal:20, flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderBottomLeftRadius:24, borderBottomRightRadius:24 },
  backBtn:{ width:40, height:40, borderRadius:12, backgroundColor:'rgba(255,255,255,0.18)', justifyContent:'center', alignItems:'center' },
  topTitle:{ color:'white', fontSize:16, fontWeight:'800' },
  sectionTitle:{ fontSize:11, fontWeight:'800', color:'#94A3B8', textTransform:'uppercase', marginBottom:14, marginTop:4 },
  methodCard:{ backgroundColor:'white', borderRadius:16, padding:14, flexDirection:'row', alignItems:'center', gap:12, marginBottom:12, borderWidth:1, borderColor:'#F1F5F9' },
  disabled:{ backgroundColor:'#F8FAFC', opacity:0.6 },
  selectedCard:{ borderColor:BLEU, borderWidth:1.5, backgroundColor:'#EFF6FF' },
  logoWrap:{ width:48, height:48, borderRadius:12, backgroundColor:'#F8FAFC', justifyContent:'center', alignItems:'center', overflow:'hidden' },
  logo:{ width:36, height:36 },
  methodName:{ fontSize:14, fontWeight:'800', color:'#0F172A' },
  methodDesc:{ fontSize:11, color:'#64748B', marginTop:2 },
  badgeSoon:{ backgroundColor:'#F1F5F9', paddingHorizontal:6, paddingVertical:2, borderRadius:6 },
  badgeSoonText:{ fontSize:9, fontWeight:'800', color:'#94A3B8' },
  amountBox:{ backgroundColor:'white', borderRadius:20, padding:16, marginTop:8, borderWidth:1, borderColor:'#E0E7FF', elevation:2 },
  amountHeader:{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:14 },
  amountTitle:{ flex:1, fontSize:14, fontWeight:'800', color:'#0F172A' },
  label:{ fontSize:12, fontWeight:'700', color:'#334155', marginBottom:6 },
  inputBox:{ flexDirection:'row', alignItems:'center', backgroundColor:'#F8FAFC', borderRadius:12, borderWidth:1, borderColor:'#E2E8F0', paddingHorizontal:14, height:54 },
  input:{ flex:1, fontSize:20, fontWeight:'900', color:'#0F172A' },
  devise:{ fontSize:12, fontWeight:'800', color:'#94A3B8' },
  quickRow:{ flexDirection:'row', gap:8, marginTop:12 },
  quickBtn:{ backgroundColor:'#F1F5F9', paddingHorizontal:12, paddingVertical:6, borderRadius:8 },
  quickText:{ fontSize:12, fontWeight:'700', color:'#334155' },
  btnPay:{ backgroundColor:BLEU, height:50, borderRadius:12, flexDirection:'row', justifyContent:'center', alignItems:'center', gap:8, marginTop:18 },
  btnPayText:{ color:'white', fontWeight:'800', fontSize:13 },
  infoBox:{ flexDirection:'row', gap:8, backgroundColor:'#EFF6FF', padding:10, borderRadius:10, marginTop:12, alignItems:'flex-start' },
  infoText:{ flex:1, fontSize:10, color:'#334155', fontWeight:'500', lineHeight:14 },
});