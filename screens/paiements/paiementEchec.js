import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';

export default function PaiementEchec({ route, navigation }) {
  const numero = route.params?.numero || route.params?.id || null;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const isRechargement = numero?.startsWith('RCH');

  useEffect(() => {
    if (!numero) { setLoading(false); return; }

    const endpoint = isRechargement
     ? `https://sidneyespace.net/paiement/get-rechargement.php?numero=${numero}`
      : `https://sidneyespace.net/paiement/get-paiement.php?numero=${numero}`;

    fetch(endpoint)
     .then(r => r.json())
     .then(j => {
        if (j.success) {
          setData(isRechargement? j.rechargement : j.paiement);
        }
      })
     .catch(e => console.log('Erreur fetch echec:', e))
     .finally(() => setLoading(false));
  }, [numero]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#EF4444" />
        <Text style={{marginTop:10, color:'#64748B'}}>Vérification...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{flexGrow:1, justifyContent:'center', padding:20}}>
        <View style={styles.card}>
          <View style={styles.circle}><Text style={{fontSize:40}}>❌</Text></View>

          <Text style={styles.title}>
            {isRechargement? 'Rechargement Échoué' : 'Paiement Échoué'}
          </Text>
          <Text style={styles.sub}>
            {isRechargement
             ? "Une erreur est survenue. Ton compte n'a pas été crédité."
              : "Une erreur est survenue lors du paiement. Votre compte n'a pas été débité."}
          </Text>

          <View style={styles.box}>
            <Text style={styles.line}><Text style={styles.bold}>Réf:</Text> {numero || 'N/A'}</Text>
            {data?.montant && <Text style={styles.line}><Text style={styles.bold}>Montant:</Text> {Number(data.montant).toLocaleString('fr-FR')} FCFA</Text>}
            {data?.id_loyer && <Text style={styles.line}><Text style={styles.bold}>Loyer:</Text> {data.id_loyer}</Text>}
            <Text style={styles.line}><Text style={styles.bold}>Statut:</Text> <Text style={{color:'#EF4444', fontWeight:'800'}}>{data?.etat || 'Echec'}</Text></Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              {isRechargement
               ? '💡 Vérifie ton solde Wave et réessaie. Aucun montant n\'a été prélevé.'
                : '💡 Vérifie ton solde et réessaie. Si le problème persiste, contacte la régie.'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.btn, {backgroundColor: isRechargement? '#0D5C2E' : '#0F172A'}]}
            onPress={() => {
              if(isRechargement){
                navigation.replace('Recharge');
              } else {
                navigation.replace('Paiement');
              }
            }}
          >
            <Text style={styles.btnText}>Réessayer</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btn2} onPress={() => navigation.replace('BottomTab')}>
            <Text style={styles.btn2Text}>Retour accueil</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex:1, backgroundColor:'#FEF2F2'},
  center:{flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#FEF2F2'},
  card:{backgroundColor:'white', borderRadius:24, padding:24, alignItems:'center', elevation:5, shadowColor:'#000', shadowOpacity:0.08, shadowRadius:20},
  circle:{width:80, height:80, backgroundColor:'#FEE2E2', borderRadius:40, justifyContent:'center', alignItems:'center', marginBottom:16},
  title:{fontSize:22, fontWeight:'900', color:'#991B1B', textAlign:'center'},
  sub:{color:'#64748B', marginTop:6, textAlign:'center', lineHeight:18, fontSize:13},
  box:{backgroundColor:'#F8FAFC', width:'100%', borderRadius:12, padding:12, marginTop:20, borderWidth:1, borderColor:'#F1F5F9'},
  line:{fontSize:13, marginVertical:3, color:'#334155'},
  bold:{fontWeight:'800', color:'#0F172A'},
  infoBox:{backgroundColor:'#FFFBEB', width:'100%', borderRadius:12, padding:12, marginTop:16, borderWidth:1, borderColor:'#FDE68A'},
  infoText:{fontSize:11, color:'#92400E', lineHeight:16},
  btn:{width:'100%', padding:16, borderRadius:12, alignItems:'center', marginTop:20},
  btnText:{color:'white', fontWeight:'800', fontSize:15},
  btn2:{width:'100%', padding:14, borderRadius:12, alignItems:'center', marginTop:10, borderWidth:1, borderColor:'#E2E8F0'},
  btn2Text:{color:'#64748B', fontWeight:'700'}
});