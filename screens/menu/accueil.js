import React, {
  useContext,
  useEffect,
  useState,
  useCallback
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Modal,
  TextInput,
  Pressable,
  Alert,
  Linking,
  Image
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { GlobalContext } from "../../config/globaluser";
import { useNotifications } from "../../service/notifications";
import Header from "../../components/Header";

const BLEU = '#275edd';

const getIdLoyer = (l) => {
  if (!l) return null;
  return (
    l.numero ||
    l.id_loyer ||
    l.loyer_numero ||
    l.numero_loyer ||
    l.id ||
    null
  );
}

export default function Accueil({ navigation }) {
  const { user } = useContext(GlobalContext);
  const [data, setData] = useState(null);
  const [loyerActuel, setLoyerActuel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [solde, setSolde] = useState(0);
  const [showPayModal, setShowPayModal] = useState(false);
  const [montant, setMontant] = useState("");
  const [paying, setPaying] = useState(false);

  useNotifications();

  const fetchData = async () => {
    try {
      const matricule = user?.matricule || '';
      const reponse = await fetch(
        `https://sidneyespace.net/paiement/info-loyer.php?matricule=${matricule}`
      );
      const json = await reponse.json();

      if (json.success) {
        const loyersNorm = (json.loyers || []).map(l => ({
         ...l,
          numero: getIdLoyer(l),
          reste: l.reste?? l.montant_du?? 0,
          montant: l.montant?? 0
        }));

        if (json.loyer_actuel) {
          json.loyer_actuel.numero =
            getIdLoyer(json.loyer_actuel);
        }

        setData({...json, loyers: loyersNorm });

        const enRetard = loyersNorm.filter(l =>
          (l.loyer_etat || '')
           .toLowerCase()
           .includes('retard')
        );

        const partiel = loyersNorm.filter(l =>
          (l.loyer_etat || '')
           .toLowerCase()
           .includes('partiel')
        );

        const enAttente = loyersNorm.filter(l =>
          (l.loyer_etat || '')
           .toLowerCase()
           .includes('attente')
        );

        let actuel = null;
        if (enRetard.length > 0) actuel = enRetard[0];
        else if (partiel.length > 0) actuel = partiel[0];
        else if (enAttente.length > 0) actuel = enAttente[0];
        else actuel = json.loyer_actuel || loyersNorm[0];

        if (actuel) actuel.numero = getIdLoyer(actuel);
        setLoyerActuel(actuel);

        if (json.solde!== undefined) {
          setSolde(parseFloat(json.solde));
        }
      }
    } catch (e) {
      console.log('Erreur accueil:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSolde = async () => {
    try {
      const res = await fetch(
        `https://sidneyespace.net/paiement/get-solde.php?matricule=${user?.matricule}`
      );
      const json = await res.json();
      if (json.success) {
        setSolde(parseFloat(json.solde));
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchData();
    fetchSolde();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
    fetchSolde();
  }, []);

  const handlePayer = () => {
    if (!loyerActuel) return;
    const reste = parseInt(
      loyerActuel.reste || loyerActuel.montant
    ) || 0;
    setMontant(reste.toString());
    setShowPayModal(true);
  };

  const handleValiderPaiement = async () => {
    const montantClean = montant.replace(/\D/g, "");
    if (!montantClean || parseInt(montantClean) < 5) {
      Alert.alert("Erreur", "Montant minimum 5 FCFA");
      return;
    }
    if (parseFloat(montantClean) > solde) {
      Alert.alert(
        "Solde insuffisant",
        `Solde: ${solde.toLocaleString()} FCFA.`,
        [
          {
            text: "Recharger",
            onPress: () => {
              setShowPayModal(false);
              navigation.navigate('Recharge');
            }
          },
          { text: "OK", style: "cancel" }
        ]
      );
      return;
    }
    setPaying(true);
    try {
      const res = await fetch(
        `https://sidneyespace.net/paiement/paiement.php`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            matricule: user?.matricule,
            id_loyer: getIdLoyer(loyerActuel),
            montant: montantClean
          })
        }
      );
      const json = await res.json();
      if (json.success) {
        Alert.alert(
          "Succès",
          `Paiement ${parseInt(montantClean)
           .toLocaleString()} FCFA effectué.`
        );
        setShowPayModal(false);
        setMontant("");
        fetchData();
        fetchSolde();
      } else {
        Alert.alert("Erreur", json.message);
      }
    } catch (e) {
      Alert.alert("Erreur", e.message);
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={BLEU} />
        <Text style={styles.loadingText}>
          Chargement...
        </Text>
      </View>
    );
  }

  const bien = data?.bien_actuel;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={BLEU}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[BLEU]}
          />
        }
      >
        {/* HEADER WRAPPER */}
        <View style={styles.headerWrapper}>
          <Header
            locataireName={
              user?.prenom || user?.nom || 'Souangah'
            }
            matricule={user?.matricule}
            solde={solde}
            onNotifPress={() =>
              navigation.navigate('Notifications')
            }
            onProfilePress={() =>
              navigation.navigate('Profil')
            }
          />

          {/* CARD LOGEMENT SUR LE HEADER */}
          <View style={styles.logementCard}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=200'
              }}
              style={styles.logementImg}
            />
            <View style={styles.logementInfo}>
              <Text style={styles.logementLabel}>
                Mon logement
              </Text>
              <Text style={styles.logementTitle}>
                {bien?.intitule_local ||
                  'Appartement A12'}
              </Text>
              <View style={styles.logementLoc}>
                <Ionicons
                  name="location"
                  size={14}
                  color="#475569"
                />
                <Text style={styles.logementAddr}>
                  {bien?.adresse_complete ||
                    'Résidence Les Palmiers'}
                  {'\n'}
                  <Text style={styles.logementSub}>
                    {bien?.ville ||
                      'Cocody - Abidjan'}
                  </Text>
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color="#0F172A"
            />
          </View>
        </View>

        {/* SOLDE + PROCHAIN LOYER */}
        <View style={styles.twoCardsRow}>
          <View style={styles.soldeCard}>
            <View style={styles.soldeTop}>
              <Ionicons
                name="wallet"
                size={18}
                color="white"
              />
              <Text style={styles.soldeLabel}>
                Mon solde
              </Text>
            </View>
            <Text style={styles.soldeAmount}>
              {solde.toLocaleString()} FCFA
            </Text>
            <View style={styles.aPayerBadge}>
              <Text style={styles.aPayerText}>À payer</Text>
            </View>
            <Text style={styles.soldeSub}>
              Loyer {loyerActuel?.mois || 'Octobre'}{' '}
              {loyerActuel?.annee || '2026'}
            </Text>
            <TouchableOpacity
              style={styles.rechargeBtn}
              onPress={() =>
                navigation.navigate('Recharge')
              }
            >
              <Text style={styles.rechargeText}>
                + Recharger mon compte
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.loyerCard}>
            <View style={styles.soldeTop}>
              <Ionicons
                name="calendar"
                size={18}
                color={BLEU}
              />
              <Text
                style={[
                  styles.soldeLabel,
                  { color: '#0F172A' }
                ]}
              >
                Prochain loyer
              </Text>
            </View>
            <Text style={styles.loyerAmount}>
              {loyerActuel?.montant
               ? parseInt(loyerActuel.montant)
                   .toLocaleString()
                : '150 000'}{' '}
              FCFA
            </Text>
            <Text style={styles.loyerEcheance}>
              Échéance :{' '}
              {loyerActuel?.date_echeance ||
                '05 Oct. 2026'}
            </Text>
            <TouchableOpacity
              style={styles.voirLoyerBtn}
              onPress={() =>
                navigation.navigate('Loyers')
              }
            >
              <Text style={styles.voirLoyerText}>
                Voir mes loyers
              </Text>
              <Ionicons
                name="chevron-forward"
                size={14}
                color={BLEU}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ACTIONS RAPIDES */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Actions rapides
            </Text>
            <Text style={styles.toutVoir}>Tout voir ›</Text>
          </View>

          <View style={styles.quickGrid}>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={() =>
                Linking.openURL(
                  'https://groupesidney.com/immobilier/accueil'
                )
              }
            >
              <View
                style={[
                  styles.quickIcon,
                  { backgroundColor: '#DBEAFE' }
                ]}
              >
                <Ionicons
                  name="search"
                  size={22}
                  color={BLEU}
                />
              </View>
              <Text style={styles.quickLabel}>
                Rechercher{'\n'}un bien
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              onPress={() =>
                navigation.navigate('Reclamation')
              }
            >
              <View
                style={[
                  styles.quickIcon,
                  { backgroundColor: '#FFEDD5' }
                ]}
              >
                <Ionicons
                  name="construct"
                  size={22}
                  color="#F97316"
                />
              </View>
              <Text style={styles.quickLabel}>
                Nouvelle{'\n'}réclamation
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              onPress={() =>
                navigation.navigate('Documents')
              }
            >
              <View
                style={[
                  styles.quickIcon,
                  { backgroundColor: '#DCFCE7' }
                ]}
              >
                <Ionicons
                  name="document-text"
                  size={22}
                  color="#16A34A"
                />
              </View>
              <Text style={styles.quickLabel}>
                Mes documents
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              onPress={handlePayer}
            >
              <View
                style={[
                  styles.quickIcon,
                  { backgroundColor: '#F3E8FF' }
                ]}
              >
                <Ionicons
                  name="card"
                  size={22}
                  color="#9333EA"
                />
              </View>
              <Text style={styles.quickLabel}>
                Effectuer un{'\n'}paiement
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ACTUALITES */}
        <View style={styles.actuCard}>
          <View style={styles.actuIcon}>
            <Ionicons
              name="megaphone"
              size={22}
              color={BLEU}
            />
          </View>
          <View style={styles.actuText}>
            <Text style={styles.actuTitle}>
              Actualités
            </Text>
            <Text style={styles.actuSubTitle}>
              Nouveau service disponible
            </Text>
            <Text style={styles.actuDesc}>
              Consultez les informations sur la
              gestion de votre résidence.
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={BLEU}
          />
        </View>

        {/* MES INFORMATIONS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Mes informations
          </Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <View
                style={[
                  styles.infoIcon,
                  { backgroundColor: '#DCFCE7' }
                ]}
              >
                <Ionicons
                  name="home"
                  size={20}
                  color="#16A34A"
                />
              </View>
              <Text style={styles.infoLabel}>
                Mon logement
              </Text>
              <Text style={styles.infoValue}>A12</Text>
            </View>

            <View style={styles.infoCard}>
              <View
                style={[
                  styles.infoIcon,
                  { backgroundColor: '#DBEAFE' }
                ]}
              >
                <Ionicons
                  name="wallet"
                  size={20}
                  color={BLEU}
                />
              </View>
              <Text style={styles.infoLabel}>
                Mon solde
              </Text>
              <Text style={styles.infoValue}>
                {solde.toLocaleString()} FCFA
              </Text>
            </View>

            <View style={styles.infoCard}>
              <View
                style={[
                  styles.infoIcon,
                  { backgroundColor: '#EDE9FE' }
                ]}
              >
                <Ionicons
                  name="document-text"
                  size={20}
                  color="#7C3AED"
                />
              </View>
              <Text style={styles.infoLabel}>
                Mes documents
              </Text>
              <Text style={styles.infoValue}>
                12 fichiers
              </Text>
            </View>

            <View style={styles.infoCard}>
              <View
                style={[
                  styles.infoIcon,
                  { backgroundColor: '#FEE2E2' }
                ]}
              >
                <Ionicons
                  name="alert-circle"
                  size={20}
                  color="#EF4444"
                />
              </View>
              <Text style={styles.infoLabel}>
                Mes réclamations
              </Text>
              <Text
                style={[
                  styles.infoValue,
                  { color: '#EF4444' }
                ]}
              >
                2 en cours
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* MODAL PAIEMENT */}
      <Modal
        visible={showPayModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPayModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.backdrop}
            onPress={() => setShowPayModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.handle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Payer loyer
              </Text>
              <TouchableOpacity
                onPress={() => setShowPayModal(false)}
                style={styles.closeBtn}
              >
                <Ionicons
                  name="close"
                  size={18}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>
            {loyerActuel && (
              <>
                <View style={styles.modalInfo}>
                  <Text style={styles.modalMois}>
                    {loyerActuel.mois} {loyerActuel.annee}
                  </Text>
                  <Text style={styles.modalReste}>
                    Reste: {parseInt(
                      loyerActuel.reste || 0
                    ).toLocaleString()} FCFA
                  </Text>
                  <Text style={styles.modalSolde}>
                    Solde: {solde.toLocaleString()} FCFA
                  </Text>
                </View>
                <Text style={styles.labelInput}>
                  Montant à payer
                </Text>
                <View style={styles.inputBox}>
                  <TextInput
                    value={montant}
                    onChangeText={setMontant}
                    keyboardType="numeric"
                    style={styles.input}
                    placeholder="Ex: 50000"
                  />
                  <Text style={styles.devise}>FCFA</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.btnValider,
                    paying && { opacity: 0.6 }
                  ]}
                  onPress={handleValiderPaiement}
                  disabled={paying}
                >
                  {paying? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.btnValiderText}>
                      Valider le paiement
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  scrollContent: {
    paddingBottom: 110
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC'
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontWeight: '600'
  },

  headerWrapper: {
    backgroundColor: BLEU,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 44
  },

  logementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 14,
    marginTop: -20,
    borderRadius: 16,
    padding: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    zIndex: 10
  },
  logementImg: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12
  },
  logementInfo: {
    flex: 1
  },
  logementLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700'
  },
  logementTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2
  },
  logementLoc: {
    flexDirection: 'row',
    marginTop: 4
  },
  logementAddr: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
    flex: 1,
    marginLeft: 4
  },
  logementSub: {
    fontSize: 10,
    color: '#94A3B8'
  },

  twoCardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    gap: 12,
    marginTop: 16
  },
  soldeCard: {
    flex: 1,
    backgroundColor: BLEU,
    borderRadius: 16,
    padding: 14
  },
  loyerCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  soldeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  soldeLabel: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700'
  },
  soldeAmount: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 10
  },
  aPayerBadge: {
    backgroundColor: '#FECACA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 6
  },
  aPayerText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#DC2626'
  },
  soldeSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    marginTop: 6
  },
  rechargeBtn: {
    backgroundColor: 'white',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    height: 36
  },
  rechargeText: {
    color: BLEU,
    fontSize: 10,
    fontWeight: '800'
  },
  loyerAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 10
  },
  loyerEcheance: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 6
  },
  voirLoyerBtn: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
    height: 36
  },
  voirLoyerText: {
    color: BLEU,
    fontSize: 10,
    fontWeight: '800'
  },

  section: {
    paddingHorizontal: 14,
    marginTop: 20
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A'
  },
  toutVoir: {
    fontSize: 11,
    color: BLEU,
    fontWeight: '700'
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10
  },
  quickCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 13
  },

  actuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    marginHorizontal: 14,
    marginTop: 18,
    borderRadius: 14,
    padding: 14,
    gap: 12
  },
  actuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center'
  },
  actuText: {
    flex: 1
  },
  actuTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A'
  },
  actuSubTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2
  },
  actuDesc: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 13
  },

  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
    justifyContent: 'space-between'
  },
  infoCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  infoLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center'
  },
  infoValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
    textAlign: 'center'
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)'
  },
  backdrop: {
   ...StyleSheet.absoluteFillObject
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 30
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A'
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalInfo: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginTop: 14
  },
  modalMois: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A'
  },
  modalReste: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '700',
    marginTop: 4
  },
  modalSolde: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '700',
    marginTop: 2
  },
  labelInput: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginTop: 16,
    marginBottom: 6
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 54
  },
  input: {
    flex: 1,
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A'
  },
  devise: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8'
  },
  btnValider: {
    backgroundColor: BLEU,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18
  },
  btnValiderText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 14
  }
});