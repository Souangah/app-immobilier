import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, BackHandler,
} from 'react-native';

export default function PaiementSuccess({ route, navigation }) {
  // numero reçu depuis le deep link sidneyespace://paiement/success?numero=RCH...
  const numero = route.params?.numero || route.params?.id || null;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const isRechargement = !!numero && String(numero).startsWith('RCH');

  // Le bouton retour Android ramène à l'accueil (l'écran est le seul de la pile après un deep link)
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.replace('BottomTab');
      return true;
    });
    return () => sub.remove();
  }, [navigation]);

  useEffect(() => {
    if (!numero) { setLoading(false); return; }

    let cancelled = false;
    const base = 'https://sidneyespace.net/paiement';
    const endpoint = isRechargement
      ? `${base}/get-rechargement.php?numero=${encodeURIComponent(numero)}`
      : `${base}/get-paiement.php?numero=${encodeURIComponent(numero)}`;

    fetch(endpoint)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j.success) {
          setData(isRechargement ? j.rechargement : j.paiement);
        } else {
          // Fallback : on affiche au moins la référence
          setData(
            isRechargement
              ? { montant: j.montant || 0 }
              : { montant: j.montant || 0, id_loyer: j.id_loyer || numero }
          );
        }
      })
      .catch((e) => console.log('Erreur fetch success:', e))
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [numero, isRechargement]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0D5C2E" />
        <Text style={{ marginTop: 12, color: '#64748B' }}>
          Validation du {isRechargement ? 'rechargement' : 'paiement'}...
        </Text>
      </View>
    );
  }

  const aSolde = isRechargement && data?.solde_compte !== undefined && data?.solde_compte !== null;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
        <View style={styles.card}>
          <View style={styles.circle}>
            <Text style={{ fontSize: 40 }}>✅</Text>
          </View>

          <Text style={styles.title}>
            {isRechargement ? 'Rechargement Réussi!' : 'Paiement Réussi!'}
          </Text>
          <Text style={styles.sub}>
            {isRechargement ? 'Ton compte a été crédité avec succès' : 'Ton loyer a été validé avec succès'}
          </Text>

          <View style={styles.montantBox}>
            <Text style={styles.montantLabel}>
              {isRechargement ? 'Montant rechargé' : 'Montant payé'}
            </Text>
            <Text style={styles.montantValue}>
              {data?.montant ? Number(data.montant).toLocaleString('fr-FR') : '---'} FCFA
            </Text>
          </View>

          <View style={styles.box}>
            <Text style={styles.line}><Text style={styles.bold}>Réf:</Text> {numero}</Text>
            {data?.locataire && (
              <Text style={styles.line}><Text style={styles.bold}>Matricule:</Text> {data.locataire}</Text>
            )}
            {!isRechargement && data?.id_loyer && (
              <Text style={styles.line}><Text style={styles.bold}>Loyer:</Text> {data.id_loyer}</Text>
            )}
            {aSolde && (
              <Text style={[styles.line, { color: '#16A34A', fontWeight: '800', marginTop: 8 }]}>
                Nouveau solde: {Number(data.solde_compte).toLocaleString('fr-FR')} FCFA
              </Text>
            )}
          </View>

          <TouchableOpacity style={styles.btn} onPress={() => navigation.replace('BottomTab')}>
            <Text style={styles.btnText}>Retour à l'accueil</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btn2}
            onPress={() =>
              navigation.replace(isRechargement ? 'HistoriqueRechargement' : 'HistoriquePaiement')
            }
          >
            <Text style={styles.btn2Text}>
              {isRechargement ? 'Voir mes rechargements' : 'Voir ma quittance'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0FDF4' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0FDF4' },
  card: { backgroundColor: 'white', borderRadius: 24, padding: 24, alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 20 },
  circle: { width: 80, height: 80, backgroundColor: '#DCFCE7', borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '900', color: '#0F172A', textAlign: 'center' },
  sub: { color: '#64748B', marginTop: 6, textAlign: 'center' },
  montantBox: { marginTop: 20, alignItems: 'center', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16, width: '100%' },
  montantLabel: { fontSize: 12, color: '#64748B', fontWeight: '600', textTransform: 'uppercase' },
  montantValue: { fontSize: 28, fontWeight: '900', color: '#0D5C2E', marginTop: 4 },
  box: { backgroundColor: '#F8FAFC', width: '100%', borderRadius: 12, padding: 12, marginTop: 20, borderWidth: 1, borderColor: '#F1F5F9' },
  line: { fontSize: 13, marginVertical: 3, color: '#334155' },
  bold: { fontWeight: '800', color: '#0F172A' },
  btn: { backgroundColor: '#0D5C2E', width: '100%', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  btnText: { color: 'white', fontWeight: '800', fontSize: 15 },
  btn2: { width: '100%', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  btn2Text: { color: '#64748B', fontWeight: '700' },
});