import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BLEU = '#275edd';

function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "0";
  const num = parseInt(value.toString().replace(/\D/g, "")) || 0;
  return num.toLocaleString('fr-FR');
}

export default function Header({
  locataireName = "user",
  matricule = null,
  solde = "0",
  etatCompte = "À jour",
  onNotifPress,
  onProfilePress
}) {
  const [showSolde, setShowSolde] = useState(true);
  const [soldeLive, setSoldeLive] = useState(solde);
  const intervalRef = useRef(null);

  // Sync prop initiale
  useEffect(() => {
    setSoldeLive(solde);
  }, [solde]);

  // ACTUALISATION TOUTES LES 2 SECONDES
  useEffect(() => {
    if (!matricule) return;

    const fetchSolde = async () => {
      try {
        const res = await fetch(`https://sidneyespace.net/paiement/get-solde.php?matricule=${matricule}`);
        const json = await res.json();
        if (json.success) {
          setSoldeLive(json.solde);
        }
      } catch (e) {
        console.log("Erreur refresh solde:", e);
      }
    };

    // Premier appel immédiat
    fetchSolde();

    // Puis toutes les 2 secondes
    intervalRef.current = setInterval(fetchSolde, 2000);

    // Nettoyage
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [matricule]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BLEU} />

      {/* LIGNE 1 : Profil + Notif */}
      <View style={styles.topRow}>
        <TouchableOpacity onPress={onProfilePress} style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{locataireName.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.welcome}>Bonjour,</Text>
            <Text style={styles.name} numberOfLines={1}>{locataireName}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconBtn} onPress={onNotifPress}>
          <Ionicons name="notifications-outline" size={22} color="white" />
          <View style={styles.dot} />
        </TouchableOpacity>
      </View>

      {/* LIGNE 2 : SOLDE CENTRÉ */}
      <View style={styles.soldeContainer}>
        <View style={styles.soldeHeader}>
          <Text style={styles.soldeLabel}>Solde disponible</Text>
          <TouchableOpacity onPress={() => setShowSolde(!showSolde)} style={styles.eyeBtn}>
            <Ionicons
              name={showSolde ? "eye-outline" : "eye-off-outline"}
              size={20}
              color="rgba(255,255,255,0.8)"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.soldeMainRow}>
          <Text style={styles.soldeBig}>
            {showSolde ? formatMoney(soldeLive) : "••••••"}
          </Text>
          <Text style={styles.soldeDevise}>FCFA</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: BLEU,
    paddingTop: Platform.OS === 'ios' ? 58 : 44,
    paddingBottom: 22,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: BLEU,
    fontWeight: '900',
    fontSize: 17,
  },
  welcome: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '600',
  },
  name: {
    color: 'white',
    fontSize: 14,
    fontWeight: '800',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: BLEU,
  },
  soldeContainer: {
    marginTop: 20,
    alignItems: 'center', // ← centre tout le bloc solde
  },
  soldeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  soldeLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  eyeBtn: {
    padding: 4,
  },
  soldeMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginTop: 6,
    justifyContent: 'center', // ← centre le montant + devise
  },
  soldeBig: {
    color: 'white',
    fontSize: 36,
    fontWeight: '900',
    lineHeight: 40,
    letterSpacing: -1,
  },
  soldeDevise: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
});