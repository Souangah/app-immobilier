import { useContext, useEffect, useState } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { GlobalContext } from "../config/globaluser";

// Config globale une seule fois
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

// Fonction qui fait tout : permission + token + API
async function getAndSaveToken(matricule) {
    if (!matricule) {
        console.log("Pas de matricule, impossible d'enregistrer");
        return null;
    }

    if (!Device.isDevice) {
        console.log("Les notifications push nécessitent un appareil physique.");
        return null;
    }

    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus!== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus!== "granted") {
        console.log("Permission de notification refusée");
        return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const expoToken = tokenData.data;

    console.log("================================");
    console.log("TOKEN EXPO :", expoToken);
    console.log("MATRICULE :", matricule);
    console.log("================================");

    // APPEL API - vérifie et modifie si existe, ajoute sinon
    try {
        const res = await fetch('https://sidneyespace.net/paiement/token.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                matricule: matricule,
                token: expoToken
            })
        });
        const json = await res.json();
        console.log("API SAVE TOKEN:", json);
    } catch (e) {
        console.log("Erreur save token:", e);
    }

    return expoToken;
}

// HOOK - c'est lui qui récupère le user depuis GlobalContext
export function useNotifications() {
    const { user } = useContext(GlobalContext);
    const [token, setToken] = useState(null);

    useEffect(() => {
        if (user?.matricule) {
            getAndSaveToken(user.matricule).then(t => setToken(t));
        }
    }, [user]);

    return token;
}