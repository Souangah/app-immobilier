import React, { useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { GlobalContext } from '../config/globaluser';

export default function Connexion({ navigation }) {
  const [telephone, setTelephone] = useState('');
  const [mdp, setMdp] = useState('');
  const [showMdp, setShowMdp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { login } = useContext(GlobalContext); // <-- CHANGE ICI

  const validate = () => {
    const newErrors = {};
    if (!telephone.trim()) newErrors.telephone = 'Numéro requis';
    if (!mdp.trim()) newErrors.mdp = 'Mot de passe requis';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await fetch('https://sidneyespace.net/paiement/connexion.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telephone: telephone.trim(), mdp: mdp.trim() }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        await login(data.locataire); // <-- CHANGE ICI : login au lieu de setUser
        navigation.replace('BottomTab');
      } else {
        Alert.alert('Échec', data.message || 'Téléphone ou mot de passe incorrect');
      }
    } catch (e) {
      Alert.alert('Erreur réseau', 'Impossible de se connecter au serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#275edd" />
      <View style={styles.header}>
        <View style={styles.logoContainer}><Text style={styles.logoIcon}>🏢</Text></View>
        <Text style={styles.brand}>SIDNEY ESPACE IMMOBILIER</Text>
        <Text style={styles.headerTitle}>Espace Locataire</Text>
        <Text style={styles.headerSubtitle}>Payer vos loyers en toute simplicité</Text>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.formWrapper}>
        <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Connexion</Text>
            <Text style={styles.cardSub}>Entrez vos identifiants locataire</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Téléphone</Text>
              <View style={[styles.inputContainer, errors.telephone && styles.inputError]}>
                <Text style={styles.inputIcon}>📱</Text>
                <TextInput style={styles.input} placeholder="Ex: 07 01 02 03 04" placeholderTextColor="#94A3B8" keyboardType="phone-pad" value={telephone} onChangeText={(t) => { setTelephone(t); if(errors.telephone) setErrors({...errors, telephone: null}) }} />
              </View>
              {errors.telephone && <Text style={styles.errorText}>{errors.telephone}</Text>}
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={[styles.inputContainer, errors.mdp && styles.inputError]}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput style={styles.input} placeholder="Votre mot de passe" placeholderTextColor="#94A3B8" secureTextEntry={!showMdp} value={mdp} onChangeText={(t) => { setMdp(t); if(errors.mdp) setErrors({...errors, mdp: null}) }} />
                <TouchableOpacity onPress={() => setShowMdp(!showMdp)} style={styles.eyeBtn}><Text style={styles.eyeText}>{showMdp ? '🙈' : '👁'}</Text></TouchableOpacity>
              </View>
              {errors.mdp && <Text style={styles.errorText}>{errors.mdp}</Text>}
            </View>
            <TouchableOpacity style={styles.forgotBtn}><Text style={styles.forgotText}>Mot de passe oublié ?</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.loginBtn, loading && { opacity: 0.7 }]} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.loginText}>Se connecter</Text>}
            </TouchableOpacity>
          </View>
          <Text style={styles.footer}>© 2026 IMMO GESTION </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const BLEU = '#275edd';
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BLEU },
  header: { paddingTop: 60, paddingBottom: 40, paddingHorizontal: 24, alignItems: 'center' },
  logoContainer: { width: 72, height: 72, backgroundColor: 'white', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  logoIcon: { fontSize: 36 },
  brand: { color: 'rgba(255,255,255,0.8)', fontWeight: '800', letterSpacing: 3, fontSize: 12, marginBottom: 12 },
  headerTitle: { color: 'white', fontSize: 28, fontWeight: '800', marginBottom: 8 },
  headerSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 14, textAlign: 'center' },
  formWrapper: { flex: 1, backgroundColor: '#F8FAFC', borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' },
  formScroll: { padding: 24, paddingBottom: 40 },
  card: { backgroundColor: 'white', borderRadius: 24, padding: 24, elevation: 10 },
  cardTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  cardSub: { fontSize: 13, color: '#64748B', marginTop: 4, marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, paddingHorizontal: 14, height: 56 },
  inputError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  inputIcon: { fontSize: 16, marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#0F172A', fontWeight: '500' },
  eyeBtn: { padding: 6 },
  eyeText: { fontSize: 16 },
  errorText: { color: '#EF4444', fontSize: 11, marginTop: 6 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 22 },
  forgotText: { color: BLEU, fontWeight: '700', fontSize: 13 },
  loginBtn: { backgroundColor: BLEU, height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  loginText: { color: 'white', fontWeight: '800', fontSize: 15 },
  footer: { textAlign: 'center', color: '#94A3B8', fontSize: 11, marginTop: 24 },
});