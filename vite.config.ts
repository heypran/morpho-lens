import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const isProduction = mode === 'production';

  return {
    base: "/",
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    plugins: [react()],
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.RPC_URL": JSON.stringify(env.RPC_URL),
      "process.env.RPC_URL_MAINNET": JSON.stringify(env.RPC_URL_MAINNET),
      "process.env.RPC_URL_BASE": JSON.stringify(env.RPC_URL_BASE),
      "process.env.RPC_URL_ARBITRUM": JSON.stringify(env.RPC_URL_ARBITRUM),
      "process.env.RPC_URL_OPTIMISM": JSON.stringify(env.RPC_URL_OPTIMISM),
      "process.env.NODE_ENV": JSON.stringify(mode),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    esbuild: isProduction ? {
      drop: ['console', 'debugger'],
    } : {},
  };
});
