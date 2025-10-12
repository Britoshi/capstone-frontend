// import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";

export default {
	plugins: [react(), tailwind()],
	server: {
		proxy: {
			"/api": {
				target: "https://localhost:7002", // your ASP.NET dev URL
				changeOrigin: true,
				secure: false, // dev cert
				// rewrite: (p: string) => p.replace(/^\/api/, "")
			}
		}
	}
};
