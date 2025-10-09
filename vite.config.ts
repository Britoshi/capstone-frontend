export default {
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
