"use client";

import React from "react";
import Link from "next/link";
import { Trophy, Beaker } from "lucide-react"; // Assuming lucide-react is available, or use standard SVGs

const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const MAIN_APP_URL = isLocal ? "http://localhost:3000" : (process.env.NEXT_PUBLIC_MAIN_APP_URL || "https://lapollavirtual.com");
const BETA_APP_URL = isLocal ? "http://localhost:3000" : (process.env.NEXT_PUBLIC_BETA_URL || "https://champions.lapollavirtual.com");

export default function TournamentHub() {
  React.useEffect(() => {
    // Redirigir al nuevo Gateway ya que el Hub está deprecado
    window.location.href = '/gateway';
  }, []);

  return null;
}
