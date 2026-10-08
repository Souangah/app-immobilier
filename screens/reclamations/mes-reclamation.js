import React, { useContext, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Image,
  Modal,
  Dimensions
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { GlobalContext } from "../../config/globaluser";

const BLEU = '#275edd';
const BASE_URL = "https://sidneyespace.com/Demo_Immobilier/";

const API_ATTENTE = "https://sidneyespace.net/paiement/reclamation-en-attente.php";
const API_COURS = "https://sidneyespace.net/paiement/reclamation-en-cours.php";
const API_CLOTURE = "https://sidneyespace.net/paiement/reclamation-cloturer.php";

const getFileType = (path) => {
  if (!path) return null;
  const ext = path.split('.').pop().toLowerCase().split('?')[0];
  if (['jpg','jpeg','png','webp','gif'].includes(ext)) return 'image';
  if (['mp4','mov','avi','mkv','webm','3gp'].includes(ext)) return 'video';
  if (['pdf'].includes(ext)) return 'pdf';
  return 'other';
};

const getNiveauConfig = (niveau) => {
  if (!niveau) return { percent: 0, color: '#E2E8F0', label: 'Non défini' };
  const n = niveau.toLowerCase();
  if (n.includes('faible')) return { percent: 25, color: '#22C55E', label: niveau };
  if (n.includes('moyen') || n.includes('normal')) return { percent: 50, color: '#F59E0B', label: niveau };
  if (n.includes('eleve') || n.includes('élevé') || n.includes('important')) return { percent: 75, color: '#EF4444', label: niveau };
  if (n.includes('critique') || n.includes('urgent')) return { percent: 100, color: '#7F1D1D', label: niveau };
  return { percent: 60, color: BLEU, label: niveau };
};

export default function MesReclamations({ navigation }) {
  const { user } = useContext(GlobalContext);
  const [attente, setAttente] = useState([]);
  const [cours, setCours] = useState([]);
  const [cloture, setCloture] = useState([]);
  const [activeTab, setActiveTab] = useState('attente');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerFile, setViewerFile] = useState({ url: null, type: null, name: null });
  const [downloading, setDownloading] = useState(false);

  const openViewer = (path) => {
    if (!path) return;
    const url = `${BASE_URL}${path}`;
    const type = getFileType(path);
    setViewerFile({ url, type, name: path.split('/').pop() });
    setViewerVisible(true);
  };

  const downloadFile = async () => {
    try {
      if (!viewerFile.url) return;
      setDownloading(true);
      const fileUri = FileSystem.cacheDirectory + viewerFile.name;
      const { uri } = await FileSystem.downloadAsync(viewerFile.url, fileUri);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      }
    } catch (e) {
      console.log('Download error', e);
    } finally {
      setDownloading(false);
    }
  };

  const fetchData = useCallback(async () => {
    if (!user?.matricule) {
      setError('Aucune information utilisateur disponible.');
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      setError(null);
      const [resAtt, resCours, resClot] = await Promise.all([
        fetch(`${API_ATTENTE}?matricule=${user.matricule}`),
        fetch(`${API_COURS}?matricule=${user.matricule}`),
        fetch(`${API_CLOTURE}?matricule=${user.matricule}`)
      ]);
      const [jsonAtt, jsonCours, jsonClot] = await Promise.all([
        resAtt.json(), resCours.json(), resClot.json()
      ]);
      setAttente(jsonAtt.reclamations || []);
      setCours(jsonCours.reclamations || []);
      setCloture(jsonClot.reclamations || []);
    } catch (e) {
      setError('Impossible de charger vos réclamations.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.matricule]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', fetchData);
    fetchData();
    return unsub;
  }, [fetchData, navigation]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchData(); }, [fetchData]);
  const getList = () => activeTab === 'attente'? attente : activeTab === 'cours'? cours : cloture;
  const counts = { attente: attente.length, cours: cours.length, cloture: cloture.length };
  const list = getList();
  const toggleDetails = (id) => setExpandedId((c) => (c === id? null : id));

  const FileViewer = ({ path, label }) => {
    if (!path) return null;
    const type = getFileType(path);
    const url = `${BASE_URL}${path}`;
    return (
      <View style={styles.fileBlock}>
        <Text style={styles.detailLabel}>{label}</Text>
        {type === 'image' && (
          <TouchableOpacity onPress={() => openViewer(path)} style={styles.imageContainer}>
            <Image source={{ uri: url }} style={styles.fileImage} />
          </TouchableOpacity>
        )}
        {type === 'video' && (
          <TouchableOpacity onPress={() => openViewer(path)} style={styles.videoThumb}>
            <Video source={{ uri: url }} style={styles.fileVideoThumb} resizeMode="cover" shouldPlay={false} isMuted />
            <View style={styles.playBtn}><Ionicons name="play" size={28} color="white" /></View>
          </TouchableOpacity>
        )}
        {type === 'pdf' && (
          <TouchableOpacity style={styles.pdfBtn} onPress={() => openViewer(path)}>
            <Ionicons name="document-text" size={22} color={BLEU} />
            <Text style={styles.pdfText} numberOfLines={1}>{path.split('/').pop()}</Text>
            <Ionicons name="eye-outline" size={18} color={BLEU} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color={BLEU} /><Text style={styles.loadingText}>Chargement...</Text></View>;
  if (error) return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.topBar}><TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Ionicons name="chevron-back" size={20} color="#0F172A" /></TouchableOpacity><Text style={styles.topTitle}>Mes réclamations</Text><View style={{ width: 36 }} /></View>
      <View style={styles.empty}><Text style={styles.emptyTitle}>{error}</Text><TouchableOpacity style={styles.retryButton} onPress={fetchData}><Text style={styles.retryText}>Réessayer</Text></TouchableOpacity></View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.topBar}><TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Ionicons name="chevron-back" size={20} color="#0F172A" /></TouchableOpacity><Text style={styles.topTitle}>Mes réclamations</Text><View style={{ width: 36 }} /></View>
      <View style={styles.tabsWrapper}>
        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, activeTab === 'attente' && styles.tabActive]} onPress={() => setActiveTab('attente')}><View style={styles.tabContent}><View style={[styles.dot, activeTab==='attente' && styles.dotActiveAttente]} /><Text style={[styles.tabText, activeTab === 'attente' && styles.tabTextActive]}>Attente {counts.attente}</Text></View></TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'cours' && styles.tabActive]} onPress={() => setActiveTab('cours')}><View style={styles.tabContent}><View style={[styles.dot, activeTab==='cours' && styles.dotActiveCours]} /><Text style={[styles.tabText, activeTab === 'cours' && styles.tabTextActive]}>En cours {counts.cours}</Text></View></TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'cloture' && styles.tabActive]} onPress={() => setActiveTab('cloture')}><View style={styles.tabContent}><View style={[styles.dot, activeTab==='cloture' && styles.dotActiveClot]} /><Text style={[styles.tabText, activeTab === 'cloture' && styles.tabTextActive]}>Clôturée {counts.cloture}</Text></View></TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BLEU]} tintColor={BLEU} />}>
        {list.map((r, i) => {
          const cardKey = r.reclamation_id?? i;
          const isExpanded = expandedId === cardKey;
          const niveauConfig = getNiveauConfig(r.niveau_reclamation);
          return (
            <View key={cardKey} style={styles.card}>
              <View style={styles.levelBarContainer}><View style={[styles.levelBar, { width: `${niveauConfig.percent}%`, backgroundColor: niveauConfig.color }]} /></View>
              <View style={[styles.cardLeftBar, activeTab === 'attente' && styles.cardLeftBarAttente, activeTab === 'cours' && styles.cardLeftBarCours, activeTab === 'cloture' && styles.cardLeftBarClot]} />
              <View style={styles.cardInner}>
                <View style={styles.cardHead}><View style={styles.idRow}><Text style={styles.id}>#{r.reclamation_id}</Text><Text style={styles.ordre}>• ORD {r.ordre}</Text></View><View style={[styles.badge, activeTab==='attente' && styles.badgeAttente, activeTab==='cours' && styles.badgeCours, activeTab==='cloture' && styles.badgeClot]}><Text style={[styles.badgeText, activeTab==='attente' && styles.badgeTextAttente, activeTab==='cours' && styles.badgeTextCours, activeTab==='cloture' && styles.badgeTextClot]}>{r.etat}</Text></View></View>
                {r.niveau_reclamation && (<View style={styles.niveauRow}><Text style={styles.niveauLabel}>Niveau :</Text><View style={[styles.niveauBadge, { backgroundColor: niveauConfig.color + '20', borderColor: niveauConfig.color }]}><View style={[styles.niveauDot, { backgroundColor: niveauConfig.color }]} /><Text style={[styles.niveauText, { color: niveauConfig.color }]}>{niveauConfig.label}</Text></View></View>)}
                <Text style={styles.titre}>{r.titre}</Text>
                <Text style={styles.objet} numberOfLines={isExpanded? 0 : 2}>{r.objet}</Text>
                <TouchableOpacity style={styles.detailBtn} onPress={() => toggleDetails(cardKey)}><Ionicons name={isExpanded? 'chevron-up' : 'chevron-down'} size={14} color={BLEU} /><Text style={styles.detailBtnText}>{isExpanded? 'Masquer' : 'Détail'}</Text></TouchableOpacity>
                {isExpanded && (
                  <View style={styles.detailPanel}>
                    <View style={styles.detailRow}><Text style={styles.detailLabel}>Mandat</Text><Text style={styles.detailValue}>{r.intitule_mandat || r.mandat || '—'}</Text></View>
                    <View style={styles.detailRow}><Text style={styles.detailLabel}>Local</Text><Text style={styles.detailValue}>{r.intitule_local || r.local || '—'}</Text></View>
                    <View style={styles.detailRow}><Text style={styles.detailLabel}>Date</Text><Text style={styles.detailValue}>{r.date_reclamation} à {r.heure_reclamation?.slice(0,5)}</Text></View>
                    {activeTab === 'cours' && (<><View style={styles.sepLine} /><FileViewer path={r.facture} label="Facture" /><FileViewer path={r.preuve_reclamation} label="Preuve réclamation" /></>)}
                    {activeTab === 'cloture' && (<><FileViewer path={r.preuve_cloture} label="Preuve clôture" /><FileViewer path={r.facture} label="Facture" /></>)}
                  </View>
                )}
                <View style={styles.divider} />
                <View style={styles.meta}><View style={styles.metaItem}><Ionicons name="calendar-outline" size={12} color="#94A3B8" /><Text style={styles.metaVal}>{r.date_reclamation}</Text></View><View style={styles.metaItem}><Ionicons name="time-outline" size={12} color="#94A3B8" /><Text style={styles.metaVal}>{r.heure_reclamation?.slice(0,5)}</Text></View></View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={viewerVisible} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setViewerVisible(false)}>
        <View style={styles.viewerContainer}>
          <View style={styles.viewerHeader}>
            <TouchableOpacity onPress={() => setViewerVisible(false)} style={styles.viewerClose}><Ionicons name="close" size={22} color="white" /></TouchableOpacity>
            <Text style={styles.viewerTitle} numberOfLines={1}>{viewerFile.name}</Text>
            <TouchableOpacity onPress={downloadFile} style={styles.viewerDownload} disabled={downloading}>
              {downloading? <ActivityIndicator size="small" color="white" /> : <Ionicons name="download-outline" size={20} color="white" />}
            </TouchableOpacity>
          </View>

          {viewerFile.type === 'image' && (<Image source={{ uri: viewerFile.url }} style={styles.viewerImage} resizeMode="contain" />)}
          {viewerFile.type === 'video' && (<Video source={{ uri: viewerFile.url }} style={styles.viewerVideo} useNativeControls resizeMode="contain" shouldPlay />)}
          {viewerFile.type === 'pdf' && (
            <WebView
              source={{ uri: viewerFile.url }}
              style={styles.viewerWebview}
              originWhitelist={['*']}
              startInLoadingState
              renderLoading={() => <View style={styles.webviewLoading}><ActivityIndicator color={BLEU} size="large" /><Text style={styles.webviewLoadingText}>Chargement PDF...</Text></View>}
            />
          )}
          {viewerFile.type === 'pdf' && (
            <View style={styles.pdfFooter}>
              <TouchableOpacity style={styles.downloadBtn} onPress={downloadFile} disabled={downloading}>
                <Ionicons name="download" size={18} color="white" />
                <Text style={styles.downloadText}>Télécharger le PDF</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#64748B', fontWeight: '600' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 54, paddingBottom: 14, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#EEF2F7' },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  topTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  tabsWrapper: { backgroundColor: 'white', paddingBottom: 12, borderBottomWidth: 1, borderColor: '#EEF2F7' },
  tabs: { flexDirection: 'row', backgroundColor: '#F1F5F9', padding: 4, marginHorizontal: 16, borderRadius: 12, gap: 4 },
  tab: { flex: 1, height: 36, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  tabActive: { backgroundColor: 'white', elevation: 2 },
  tabContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#CBD5E1' },
  dotActiveAttente: { backgroundColor: '#D97706' },
  dotActiveCours: { backgroundColor: BLEU },
  dotActiveClot: { backgroundColor: '#16A34A' },
  tabText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  tabTextActive: { color: '#0F172A' },
  scroll: { padding: 16, paddingBottom: 120 },
  empty: { alignItems: 'center', marginTop: 90 },
  emptyIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'white', borderWidth: 1, borderColor: '#EEF2F7', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 13, fontWeight: '800', color: '#334155', textAlign: 'center', paddingHorizontal: 24 },
  emptySub: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
  retryButton: { marginTop: 18, backgroundColor: BLEU, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10 },
  retryText: { color: 'white', fontWeight: '800', fontSize: 12 },
  card: { backgroundColor: 'white', borderRadius: 18, borderWidth: 1, borderColor: '#EEF2F7', marginBottom: 12, flexDirection: 'row', overflow: 'hidden', elevation: 3 },
  levelBarContainer: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: '#F1F5F9', zIndex: 10 },
  levelBar: { height: 4, borderTopRightRadius: 2, borderBottomRightRadius: 2 },
  cardLeftBar: { width: 5, marginTop: 4 },
  cardLeftBarAttente: { backgroundColor: '#F59E0B' },
  cardLeftBarCours: { backgroundColor: BLEU },
  cardLeftBarClot: { backgroundColor: '#22C55E' },
  cardInner: { flex: 1, padding: 14, paddingTop: 16 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  id: { fontSize: 12, fontWeight: '900', color: '#0F172A' },
  ordre: { fontSize: 10, fontWeight: '700', color: '#94A3B8' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeAttente: { backgroundColor: '#FFFBEB' },
  badgeCours: { backgroundColor: '#EFF6FF' },
  badgeClot: { backgroundColor: '#DCFCE7' },
  badgeText: { fontSize: 9, fontWeight: '800' },
  badgeTextAttente: { color: '#D97706' },
  badgeTextCours: { color: BLEU },
  badgeTextClot: { color: '#16A34A' },
  niveauRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  niveauLabel: { fontSize: 10, color: '#64748B', fontWeight: '700' },
  niveauBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  niveauDot: { width: 6, height: 6, borderRadius: 3 },
  niveauText: { fontSize: 10, fontWeight: '800' },
  titre: { fontSize: 13.5, fontWeight: '800', color: '#0F172A', marginTop: 8 },
  objet: { fontSize: 12, color: '#475569', marginTop: 6, lineHeight: 18 },
  detailBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF4FF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, gap: 4, alignSelf: 'flex-start', marginTop: 12 },
  detailBtnText: { color: BLEU, fontSize: 11, fontWeight: '800' },
  detailPanel: { backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 10, marginTop: 10, gap: 8 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  detailLabel: { fontSize: 10, color: '#64748B', fontWeight: '700', width: 110 },
  detailValue: { fontSize: 11, color: '#0F172A', fontWeight: '600', flex: 1, textAlign: 'right' },
  chargeBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  sepLine: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 6 },
  detailCol: { marginTop: 6, gap: 6 },
  detailValueFull: { fontSize: 11, color: '#0F172A', fontWeight: '500', backgroundColor: 'white', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#F1F5F9', lineHeight: 16 },
  fileBlock: { marginTop: 8, gap: 6 },
  imageContainer: { width: '100%', height: 180, borderRadius: 12, overflow: 'hidden', backgroundColor: '#E2E8F0' },
  fileImage: { width: '100%', height: 180, borderRadius: 12 },
  videoThumb: { width: '100%', height: 180, borderRadius: 12, backgroundColor: 'black', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  fileVideoThumb: { width: '100%', height: 180 },
  playBtn: { position: 'absolute', width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  pdfBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderWidth: 1, borderColor: '#E2E8F0', padding: 12, borderRadius: 12, gap: 8 },
  pdfText: { flex: 1, fontSize: 11, fontWeight: '600', color: '#0F172A' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginTop: 12 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaVal: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  viewerContainer: { flex: 1, backgroundColor: 'black' },
  viewerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: 'black' },
  viewerClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1F2937', justifyContent: 'center', alignItems: 'center' },
  viewerDownload: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1F2937', justifyContent: 'center', alignItems: 'center' },
  viewerTitle: { flex: 1, color: 'white', fontWeight: '700', fontSize: 13, marginHorizontal: 12, textAlign: 'center' },
  viewerImage: { flex: 1, width: Dimensions.get('window').width },
  viewerVideo: { flex: 1, width: '100%', backgroundColor: 'black' },
  viewerWebview: { flex: 1, backgroundColor: 'white' },
  webviewLoading: { flex: 1, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', gap: 10 },
  webviewLoadingText: { color: '#64748B', fontSize: 12, fontWeight: '600' },
  pdfFooter: { backgroundColor: 'black', padding: 16, paddingBottom: 30 },
  downloadBtn: { backgroundColor: BLEU, borderRadius: 12, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  downloadText: { color: 'white', fontWeight: '800', fontSize: 13 }
});