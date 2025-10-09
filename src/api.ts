// src/api.ts
export type WeatherForecast = {
	date: string;        // ISO string from backend's DateOnly
	temperatureC: number;
	summary: string | null;
};

const API_BASE = import.meta.env.VITE_API_BASE || "https://localhost:7002";

export async function getWeather(zipcode: string | number): Promise<WeatherForecast[]> {
	const res = await fetch(`${API_BASE}/WeatherForecast?zipcode=${zipcode}`);
	if (!res.ok)
	{
		const text = await res.text();
		throw new Error(`Request failed: ${res.status} ${res.statusText} — ${text}`);
	}
	return res.json();
}


// src/api.ts
export type MeResponse = {
	id: string;
	email: string;
	displayName?: string | null;
};

const base = "/api"; // rely on Vite proxy in dev

async function http<T>(path: string, init?: RequestInit): Promise<T> {
	const res = await fetch(base + path, {
		credentials: "include", // IMPORTANT: send/receive auth cookies
		headers: {
			"Content-Type": "application/json",
			...(init?.headers ?? {})
		},
		...init
	});
	if (!res.ok) {
		const text = await res.text().catch(() => "");
		throw new Error(text || `HTTP ${res.status}`);
	}
	return res.json() as Promise<T>;
}

export async function register(email: string, password: string, displayName?: string) {
	return http<MeResponse>("/auth/register", {
		method: "POST",
		body: JSON.stringify({ email, password, displayName })
	});
}

export async function login(email: string, password: string, rememberMe = false) {
	return http<MeResponse>("/auth/login", {
		method: "POST",
		body: JSON.stringify({ email, password, rememberMe })
	});
}

export async function logout() {
	const res = await fetch(base + "/auth/logout", {
		method: "POST",
		credentials: "include"
	});
	if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
}

export async function me() {
	return http<MeResponse>("/auth/me", { method: "GET" });
}

