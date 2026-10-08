import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Activation de LayoutAnimation pour Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const BLEU = "#2563EB";
const BG_COLOR = "#F8FAFC";

const DATA = [
  {
    categorie: "Loyer & Paiement",
    icon: "wallet-outline",
    color: "#2563EB",
    faqs: [
      {
        q: "Quand dois-je payer mon loyer ?",
        r: "Le loyer est exigible entre le 1er et le 5 de chaque mois. Au-delà du 5, des pénalités de 5% peuvent s'appliquer.",
      },
      {
        q: "Comment payer ?",
        r: "Par Mobile Money, virement bancaire, ou directement à l'agence. Référence obligatoire : votre matricule locataire.",
      },
      {
        q: "Que faire si j'ai un retard ?",
        r: "Contactez immédiatement votre gestionnaire. Un échéancier peut être mis en place sur demande justifiée.",
      },
    ],
  },
  {
    categorie: "Entretien & Réparations",
    icon: "construct-outline",
    color: "#D97706",
    faqs: [
      {
        q: "Qui répare quoi ?",
        r: "Locataire : petites réparations. Propriétaire : gros œuvre, toiture.",
      },
      {
        q: "Comment signaler une panne ?",
        r: "Via l'app > Nouvelle réclamation. Service aménagement sous 24h.",
      },
      {
        q: "Puis-je faire des travaux ?",
        r: "Aucune modification sans autorisation écrite de la gérance.",
      },
    ],
  },
  {
    categorie: "Vie en communauté",
    icon: "people-outline",
    color: "#16A34A",
    faqs: [
      {
        q: "Quelles sont les heures de bruit ?",
        r: "Bruit toléré de 08h à 21h. Silence obligatoire de 21h à 07h.",
      },
      {
        q: "Puis-je avoir un animal ?",
        r: "Animaux bruyants interdits. Chiens en laisse obligatoire.",
      },
      {
        q: "Parties communes ?",
        r: "Escaliers, cour, parking doivent rester propres et dégagés.",
      },
    ],
  },
  {
    categorie: "Sécurité & Hygiène",
    icon: "shield-checkmark-outline",
    color: "#DC2626",
    faqs: [
      {
        q: "Gestion des ordures ?",
        r: "Sortir les poubelles avant 07h30. Interdiction de jeter depuis balcons.",
      },
      {
        q: "Sécurité du bâtiment ?",
        r: "Fermez toujours le portail principal. Ne donnez pas les codes à des inconnus.",
      },
      {
        q: "En cas de fuite d'eau / incendie ?",
        r: "Coupez eau/électricité, prévenez la gérance et les voisins.",
      },
    ],
  },
  {
    categorie: "Départ & Caution",
    icon: "exit-outline",
    color: "#9333EA",
    faqs: [
      {
        q: "Préavis de départ ?",
        r: "3 mois par lettre recommandée ou dépôt à l'agence.",
      },
      {
        q: "Quand récupère-t-on la caution ?",
        r: "Sous 30 jours après état des lieux de sortie si logement rendu propre.",
      },
    ],
  },
];

const FAQItem = ({ item, isOpen, onToggle, accentColor }) => {
  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={styles.questionContainer}>
          <View
            style={[styles.dotIndicator, { backgroundColor: accentColor }]}
          />
          <Text style={styles.questionText}>{item.q}</Text>
        </View>

        <View
          style={[
            styles.chevronBox,
            isOpen && { backgroundColor: accentColor + "1A" },
          ]}
        >
          <Ionicons
            name={isOpen ? "chevron-up" : "chevron-down"}
            size={16}
            color={isOpen ? accentColor : "#64748B"}
          />
        </View>
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.answerContainer}>
          <Text style={styles.answerText}>{item.r}</Text>
        </View>
      )}
    </View>
  );
};

export default function FAQReglement({ navigation }) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [activeCat, setActiveCat] = useState("Tous");

  const categories = ["Tous", ...DATA.map((d) => d.categorie)];

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(expanded === id ? null : id);
  };

  const filteredData = DATA.map((section) => {
    if (activeCat !== "Tous" && section.categorie !== activeCat) {
      return null;
    }
    const matchingFaqs = section.faqs.filter(
      (f) =>
        !search ||
        f.q.toLowerCase().includes(search.toLowerCase()) ||
        f.r.toLowerCase().includes(search.toLowerCase())
    );

    if (matchingFaqs.length === 0) return null;

    return { ...section, faqs: matchingFaqs };
  }).filter(Boolean);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header Premium */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation?.goBack()}
          style={styles.iconBtn}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Règlement intérieur</Text>
          <Text style={styles.headerSubtitle}>Guides & Consignes du bâtiment</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="help-circle-outline" size={22} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* Bar de recherche et Filtres */}
      <View style={styles.filterSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" />
          <TextInput
            placeholder="Rechercher une règle, un terme..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.catListContainer}
          renderItem={({ item }) => {
            const isActive = activeCat === item;
            return (
              <TouchableOpacity
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setActiveCat(item)}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.chipText, isActive && styles.chipTextActive]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Contenu principal */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredData.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-discontent" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Aucun résultat trouvé</Text>
            <Text style={styles.emptySub}>
              Essayez de chercher avec d'autres mots-clés ou changez de catégorie.
            </Text>
          </View>
        ) : (
          filteredData.map((section, sIndex) => (
            <View key={section.categorie} style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <View
                  style={[
                    styles.sectionIcon,
                    { backgroundColor: section.color + "15" },
                  ]}
                >
                  <Ionicons
                    name={section.icon}
                    size={18}
                    color={section.color}
                  />
                </View>
                <Text style={styles.sectionTitle}>{section.categorie}</Text>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: section.color + "15" },
                  ]}
                >
                  <Text style={[styles.badgeText, { color: section.color }]}>
                    {section.faqs.length}
                  </Text>
                </View>
              </View>

              {section.faqs.map((item, i) => {
                const id = `${sIndex}-${i}`;
                return (
                  <FAQItem
                    key={id}
                    item={item}
                    accentColor={section.color}
                    isOpen={expanded === id}
                    onToggle={() => toggleExpand(id)}
                  />
                );
              })}
            </View>
          ))
        )}

     
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 56 : 42,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  filterSection: {
    backgroundColor: "#FFFFFF",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
    marginLeft: 10,
    marginRight: 6,
  },
  catListContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
  },
  chipActive: {
    backgroundColor: BLEU,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 10,
    padding: 14,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  questionContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  dotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
  },
  questionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
    lineHeight: 18,
  },
  chevronBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  answerContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  answerText: {
    fontSize: 12.5,
    color: "#475569",
    lineHeight: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#334155",
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 20,
  },
  downloadCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  downloadIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  downloadInfo: {
    flex: 1,
    marginRight: 10,
  },
  downloadTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  downloadSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
    lineHeight: 15,
  },
  downloadBtn: {
    backgroundColor: BLEU,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  downloadBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});