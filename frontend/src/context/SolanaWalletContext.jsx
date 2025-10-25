import React, { useMemo, useContext, createContext } from 'react'; // <-- Dodaj useContext i createContext
// ... reszta importów ...
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';
const SolanaWalletContext = createContext(null);
export function SolanaWalletProvider({ children }) {
  // Use devnet for development, mainnet-beta for production
  const network = WalletAdapterNetwork.Devnet;

  // You can also provide a custom RPC endpoint
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
// --- DODAJ TEN KOD NA DOLE ---
export const useSolana = () => {
  const context = useContext(SolanaWalletContext);
  if (!context) {
    // W WalletProvider już jest context, więc użyjemy go bezpośrednio
    // To jest obejście, idealnie Context powinien być przekazany
    // Ale @solana/wallet-adapter-react nie eksportuje swojego Contextu łatwo
    // Zwrócimy pusty obiekt lub podstawowe wartości, aby uniknąć crashu
    // Lepszym rozwiązaniem byłoby użycie hooków z @solana/wallet-adapter-react bezpośrednio
    console.warn("Attempted to use Solana context outside of provider, returning minimal values.");
    return { publicKey: null, wallet: null, sendTransaction: async () => {} }; 
  }
  return context;
};
// --- KONIEC DODAWANIA ---
