// src/App.tsx
import { useEffect, useState } from "react";
import { AuthProvider, useAuthService, useCurrentUser } from "./auth/AuthProvider";
import { LoginForm } from "./auth/LoginForm";

function AppInner() {
	const auth = useAuthService();
	const user = useCurrentUser();
	const [loading, setLoading] = useState(true);

	useEffect(() => { auth.me().finally(() => setLoading(false)); }, [auth]);

	if (loading) return <p>Loading…</p>;

	return (
		<main style={{ maxWidth: 560, margin: "40px auto", fontFamily: "system-ui, sans-serif" }}>
			<h1>Account</h1>

			{!user ? (
				<>
					<LoginForm />
					<button style={{ marginTop: 12 }} onClick={async () => { await auth.me(); }}>
						Who am I?
					</button>
				</>
			) : (
				<>
					<div style={{ padding:12, border:"1px solid #eee", borderRadius:8 }}>
						<div><strong>Id:</strong> {user.id}</div>
						<div><strong>Email:</strong> {user.email}</div>
						<div><strong>DisplayName:</strong> {user.displayName ?? "(none)"} </div>
					</div>
					<div style={{ marginTop:12, display:"flex", gap:8 }}>
						<button onClick={() => auth.logout()}>Logout</button>
						<button onClick={async () => { const { openLogin } = await import("./auth/LoginController"); await openLogin(); }}>
							Open login modal
						</button>
					</div>
				</>
			)}
		</main>
	);
}

export default function App() {
	return (
		<AuthProvider>
			<AppInner />
		</AuthProvider>
	);
}
