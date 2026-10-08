import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

export default function PaiementSuccess({ route, navigation }) {
  const numero = route.params?.numero || route.params?.id;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!numero) { setLoading(false); return; }
    fetch(`https://sidneyespace.net/paiement/get-paiement.php?numero=${numero}`)
     .then(r => r.json())
     .then(j => { if (j.success) setData(j.paiement); })
     .catch(e => console.log(e))
     .finally(() => setLoading(false));
  }, [numero]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#275edd" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.circle}><Text style={{fontSize:40}}>✅</Text></View>
        <Text style={styles.title}>Paiement Réussi!</Text>
        <Text style={styles.sub}>Ton loyer a été validé avec succès</Text>

        <View style={styles.box}>
          <Text style={styles.line}><Text style={styles.bold}>Ref:</Text> {numero}</Text>
          {data && <Text style={styles.line}><Text style={styles.bold}>Montant:</Text> {Number(data.montant).toLocaleString('fr-FR')} FCFA</Text>}
          {data && <Text style={styles.line}><Text style={styles.bold}>Loyer:</Text> {data.id_loyer}</Text>}
        </View>

        <TouchableOpacity style={styles.btn} onPress={() => navigation.replace('BottomTab')}>
          <Text style={styles.btnText}>Retour accueil</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn2} onPress={() => navigation.replace('HistoriquePaiement')}>
          <Text style={styles.btn2Text}>Voir ma quittance</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex:1, backgroundColor:'#F0FDF4', justifyContent:'center', padding:20},
  center:{flex:1, justifyContent:'center', alignItems:'center'},
  card:{backgroundColor:'white', borderRadius:24, padding:24, alignItems:'center'},
  circle:{width:80, height:80, backgroundColor:'#DCFCE7', borderRadius:40, justifyContent:'center', alignItems:'center', marginBottom:16},
  title:{fontSize:22, fontWeight:'900', color:'#16A34A'},
  sub:{color:'#64748B', marginTop:6},
  box:{backgroundColor:'#F8FAFC', width:'100%', borderRadius:12, padding:12, marginTop:20},
  line:{fontSize:13, marginVertical:2},
  bold:{fontWeight:'800', color:'#0F172A'},
  btn:{backgroundColor:'#275edd', width:'100%', padding:14, borderRadius:12, alignItems:'center', marginTop:20},
  btnText:{color:'white', fontWeight:'800'},
  btn2:{width:'100%', padding:14, borderRadius:12, alignItems:'center', marginTop:10, borderWidth:1, borderColor:'#E2E8F0'},
  btn2Text:{color:'#64748B', fontWeight:'700'}
});