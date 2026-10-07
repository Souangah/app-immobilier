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
import { Picker } from '@react-native-picker/picker';
import { GlobalContext } from "../config/globaluser";

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

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Nouvelle réclamation</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

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
          {sending? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="send" size={18} color="white" />
              <Text style={styles.btnSendText}>Envoyer</Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },

  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  topTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },

  scroll: {
    padding: 14,
    paddingBottom: 100,
  },

  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginTop: 14,
    marginBottom: 6,
  },

  pickerBox: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    overflow: 'hidden',
    height: 50,
    justifyContent: 'center',
  },

  picker: {
    width: '100%',
    height: 50,
    color: '#0F172A',
  },

  textareaBox: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    minHeight: 120,
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
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },

  btnSendText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 13,
  },

});