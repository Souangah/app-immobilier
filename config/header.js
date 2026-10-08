import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BLEU = '#275edd';

function formatMoney(value) {
  if (!value) return "0";
  const num = parseInt(
    value.toString().replace(/\D/g, "")
  ) || 0;
  return num.toLocaleString('fr-FR');
}

export default function Header({
  locataireName = "Souangah",
  matricule = null,
  solde = "0",
  onNotifPress,
  onProfilePress
}) {
  const [soldeLive, setSoldeLive] = useState(solde);
  const intervalRef = useRef(null);

  useEffect(() => {
    setSoldeLive(solde);
  }, [solde]);

  useEffect(() => {
    if (!matricule) return;

    const fetchSolde = async () => {
      try {
        const res = await fetch(
          `https://sidneyespace.net/paiement/get-solde.php?matricule=${matricule}`
        );
        const json = await res.json();
        if (json.success) {
          setSoldeLive(json.solde);
        }
      } catch (e) {}
    };

    fetchSolde();
    intervalRef.current = setInterval(
      fetchSolde,
      2000
    );

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [matricule]);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={BLEU}
      />

      {/* FOND IMMEUBLE */}
      <Image
        source={{
          uri: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800'
        }}
        style={styles.bgImage}
      />
      <View style={styles.bgOverlay} />

      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.logoRow}
          onPress={onProfilePress}
          activeOpacity={0.8}
        >
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>GS</Text>
          </View>
          <Text style={styles.logoLabel}>
            GROUPE{'\n'}SIDNEY
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bellBtn}
          onPress={onNotifPress}
        >
          <Ionicons
            name="notifications"
            size={20}
            color="white"
          />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.hello}>
        Bonjour, {locataireName} 👋
      </Text>
      <Text style={styles.subHello}>
        Bienvenue sur votre espace locataire
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: BLEU,
    paddingTop: Platform.OS === 'ios'? 58 : 44,
    paddingBottom: 42,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden'
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 280,
    height: 200,
    opacity: 0.18
  },
  bgOverlay: {
   ...StyleSheet.absoluteFillObject,
    backgroundColor: BLEU,
    opacity: 0.92
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  logoBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  logoText: {
    color: BLEU,
    fontWeight: '900',
    fontSize: 16,
    fontStyle: 'italic'
  },
  logoLabel: {
    color: 'white',
    fontWeight: '800',
    fontSize: 10,
    lineHeight: 11
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: BLEU
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800'
  },
  hello: {
    color: 'white',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 20,
    zIndex: 2
  },
  subHello: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    zIndex: 2
  }
});