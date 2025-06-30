import { createContext, useContext, useState, useEffect } from "react";
import axiosInstance from '../axiosInstance/axiosWithAuth';

import keycloak from "../keyclaok/keycloak";

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
    const [walletBalance, setWalletBalance] = useState(null);

    const fetchWalletBalance = async () => {
        try {
        const response = await axiosInstance.get(' {Wallet_Service_Address}/api/finance/user-wallet/', {
            headers: {
            Authorization: `Bearer ${keycloak.token}`,
            }
        });
        setWalletBalance(response.data.balance);
        } catch (error) {
        console.error("خطا در دریافت موجودی کیف پول:", error);
        }
    };

    useEffect(() => {
        fetchWalletBalance();
    }, []);

    return (
        <WalletContext.Provider value={{ walletBalance, fetchWalletBalance }}>
            {children}
        </WalletContext.Provider>
    );
};

export const useWallet = () => useContext(WalletContext);
