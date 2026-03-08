"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import type { Adapter } from "@solana/wallet-adapter-base";
import { clusterApiUrl } from "@solana/web3.js";

import "@solana/wallet-adapter-react-ui/styles.css";

const SOLANA_NETWORK = "devnet";

export function SolanaProvider({ children }: { children: ReactNode }) {
  const endpoint = useMemo(() => clusterApiUrl(SOLANA_NETWORK), []);
  const [wallets, setWallets] = useState<Adapter[]>([]);

  useEffect(() => {
    import("@solana/wallet-adapter-wallets").then((mod) => {
      setWallets([
        new mod.PhantomWalletAdapter(),
        new mod.SolflareWalletAdapter(),
        new mod.LedgerWalletAdapter(),
        new mod.CoinbaseWalletAdapter(),
      ]);
    });
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
