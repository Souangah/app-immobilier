import React, { useState, createContext, useEffect } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';

export const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // 1. Charger l'utilisateur au démarrage
    useEffect(() => {
        const getUser = async () => {
            try {
                const jsonValue = await AsyncStorage.getItem('locataire');
                if (jsonValue != null) {
                    setUser(JSON.parse(jsonValue));
                }
            } catch (e) {
                console.log("Erreur chargement user", e);
            } finally {
                setLoading(false);
            }
        };
        getUser();
    }, []);

    // 2. Sauvegarder quand on setUser
    const login = async (userData) => {
        try {
            setUser(userData);
            await AsyncStorage.setItem('locataire', JSON.stringify(userData));
        } catch (e) {
            console.log(e);
        }
    };

    const logout = async () => {
        try {
            setUser(null);
            await AsyncStorage.removeItem('locataire');
        } catch (e) {
            console.log(e);
        }
    };

    return (
        <GlobalContext.Provider value={{ user, setUser, login, logout, loading }}>
            {children}
        </GlobalContext.Provider>
    );
};