import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  Dimensions,
  Image,
} from "react-native";

const { width, height } = Dimensions.get("window");
const BLEU = "#275edd";

export default function SplashScreen({ navigation }) {
  // Animations
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslate = useRef(new Animated.Value(20)).current;
  const loaderWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Séquence d'animations
    Animated.sequence([
      // 1. Logo apparaît
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // 2. Texte apparaît
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslate, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      // 3. Barre de chargement
      Animated.timing(loaderWidth, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: false,
      }),
    ]).start(() => {
      // Navigation après l'animation
      setTimeout(() => {
        navigation.replace("BottomTab"); // Remplacez par l'écran souhaité après le splash
      }, 300);
    });
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Cercles décoratifs en arrière-plan */}
      <View style={[styles.circle, styles.circleTop]} />
      <View style={[styles.circle, styles.circleBottom]} />

      {/* Contenu central */}
      <View style={styles.content}>
        {/* Logo de l'entreprise */}
        <Animated.View
          style={[
            styles.logoBox,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          {/* Remplacez le chemin par votre image de logo */}
          <Image
            source={require("../../assets/images/sidney.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Nom de l'entreprise */}
        <Animated.View
          style={{
            opacity: textOpacity,
            transform: [{ translateY: textTranslate }],
          }}
        >
          <Text style={styles.companyName}>
            <Text style={styles.companyNameBold}>Sidney</Text> Espace
          </Text>
          <Text style={styles.tagline}>Votre logement, simplifié.</Text>
        </Animated.View>
      </View>

      {/* Barre de chargement en bas */}
      <View style={styles.loaderContainer}>
        <View style={styles.loaderTrack}>
          <Animated.View
            style={[
              styles.loaderFill,
              {
                width: loaderWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.loaderText}>Chargement...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  // Cercles décoratifs
  circle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: BLEU,
    opacity: 0.05,
  },
  circleTop: {
    width: width * 1.2,
    height: width * 1.2,
    top: -width * 0.6,
    right: -width * 0.3,
  },
  circleBottom: {
    width: width * 0.9,
    height: width * 0.9,
    bottom: -width * 0.4,
    left: -width * 0.2,
  },
  // Contenu
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoBox: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  logoImage: {
    width: width * 0.45,
    height: width * 0.45,
  },
  // Nom de l'entreprise
  companyName: {
    fontSize: 28,
    fontWeight: "300",
    color: "#0F172A",
    letterSpacing: 1,
    textAlign: "center",
  },
  companyNameBold: {
    fontWeight: "900",
    color: BLEU,
  },
  tagline: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
    letterSpacing: 0.5,
    textAlign: "center",
    marginTop: 8,
  },
  // Loader
  loaderContainer: {
    position: "absolute",
    bottom: 80,
    alignItems: "center",
    width: "100%",
  },
  loaderTrack: {
    width: width * 0.5,
    height: 4,
    backgroundColor: "#F1F5F9",
    borderRadius: 2,
    overflow: "hidden",
  },
  loaderFill: {
    height: 4,
    backgroundColor: BLEU,
    borderRadius: 2,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
    letterSpacing: 1,
  },
});