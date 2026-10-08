import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  StatusBar
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import { GlobalContext } from "../../config/globaluser";

const BLEU = '#275edd';


const TITRES = [
  "Fuite d'eau",
  "Problème électricité",
  "Climatisation en panne",
  "Problème plomberie",
  "Porte / Fenêtre défectueuse",
  "Problème loyer / paiement",
  "Bruit / Voisinage",
  "Propreté / Hygiène",
  "Autre"
];

export default function NouvelleReclamation({ navigation }) {

  const { user } = useContext(GlobalContext);

  const [titre, setTitre] = useState("");
  const [objet, setObjet] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!titre) {
      return Alert.alert("Erreur", "Choisissez un titre");
    }
    if (!objet.trim() || objet.length < 10) {
      return Alert.alert("Erreur", "Objet minimum 10 caractères");
    }

    setSending(true);
    try {
      const res = await fetch("https://sidneyespace.net/paiement/nouvelle-reclamation.php", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matricule: user?.matricule,
          titre: titre,
          objet: objet
        })
      });

      const json = await res.json();

      if (json.success) {
        Alert.alert(
          "Succès",
          `Réclamation  enregistrée`,
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
        setTitre("");
        setObjet("");
      } else {
        Alert.alert("Erreur", json.message);
      }
    } catch (e) {
      Alert.alert("Erreur", e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <LinearGradient colors={['#EEF4FF', '#F8FAFC', '#F8FAFC']} style={styles.headerGradient}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Nouvelle réclamation</Text>
          <View style={{ width: 36 }} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <View style={styles.headerInfo}>
            <View style={styles.iconWrap}>
              <Ionicons name="document-text-outline" size={22} color={BLEU} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Décrivez votre problème</Text>
              <Text style={styles.cardSubtitle}>Votre demande sera traitée par l’équipe.</Text>
            </View>
          </View>

          <Text style={styles.label}>Titre *</Text>
          <View style={styles.pickerBox}>
            <Picker
              selectedValue={titre}
              onValueChange={(v) => setTitre(v)}
              style={styles.picker}
            >
              <Picker.Item label="== Choisir un titre ==" value="" />
              {TITRES.map((t, i) => (
                <Picker.Item key={i} label={t} value={t} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Description *</Text>
          <View style={styles.textareaBox}>
            <TextInput
              value={objet}
              onChangeText={setObjet}
              placeholder="Décrivez votre problème en détail..."
              placeholderTextColor="#94A3B8"
              multiline
              style={styles.textarea}
            />
          </View>

          <TouchableOpacity
            style={[styles.btnSend, sending && { opacity: 0.6 }]}
            onPress={submit}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="send" size={18} color="white" />
                <Text style={styles.btnSendText}>Envoyer</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },

  headerGradient: {
    paddingBottom: 16,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 14,
  },

  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  topTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.2,
  },

  scroll: {
    padding: 16,
    paddingBottom: 100,
  },

  formCard: {
    backgroundColor: 'white',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EAF0F7',
    padding: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },

  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },

  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#EEF4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },

  cardSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 3,
  },

  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginTop: 16,
    marginBottom: 8,
  },

  pickerBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    overflow: 'hidden',
    height: 52,
    justifyContent: 'center',
  },

  picker: {
    width: '100%',
    height: 52,
    color: '#0F172A',
  },

  textareaBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    minHeight: 150,
  },

  textarea: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
    textAlignVertical: 'top',
  },

  btnSend: {
    backgroundColor: BLEU,
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 22,
    shadowColor: '#275edd',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  btnSendText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 13,
  },

});