// src/auth/AuthService.ts
export type MeResponse = { id: string; email: string; displayName?: string };

export class AuthService {
	private _me: MeResponse | null = null;

	get current(): MeResponse | null { return this._me; }

	async me(): Promise<MeResponse | null> {
		try {
			const u = await fetchJSON<MeResponse>("/api/auth/me");
			this._me = u;
			return u;
		} catch { this._me = null; return null; }
	}

	async login(email: string, password: string) {
		const u = await fetchJSON<MeResponse>("/api/auth/login", {
			method: "POST",
			body: JSON.stringify({ email, password }),
		});
		this._me = u;
		return u;
	}

	async register(email: string, password: string, displayName?: string) {
		const u = await fetchJSON<MeResponse>("/api/auth/register", {
			method: "POST",
			body: JSON.stringify({ email, password, displayName }),
		});
		this._me = u;
		return u;
	}

	async logout() {
		await fetchJSON<void>("/api/auth/logout", { method: "POST" });
		this._me = null;
	}
}

// small helper (cookie-based)
async function fetchJSON<T>(url: string, options: RequestInit = {}): Promise<T> {
	const res = await fetch(url, {
		credentials: "include",
		headers: { "Content-Type": "application/json", ...(options.headers || {}) },
		...options,
	});
	if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);
	return res.status === 204 ? (undefined as T) : res.json();
}
