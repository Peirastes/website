import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: './' emits relative asset URLs so the built app works when served
// from a subfolder (e.g. peirastes.com/rotating-extended-cylinder/).
export default defineConfig({
  base: "./",
  plugins: [react()],
});
