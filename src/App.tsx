// App.tsx
import {useEffect, useRef, useState} from "react";

import LoadingScreen from "./LoadingScreen/LoadingScreen";
import UserSelectPage from "./UserSelect/UserSelectPage";
import Terminal from "./Terminal/Terminal";
import {useAuthService, useCurrentUser} from "./auth/AuthProvider.tsx";
import {LoginForm} from "./auth/LoginForm.tsx";
import SceneRouter from "./SceneManager/SceneRouter.tsx";
import type {Scene} from "./SceneManager/Scenes.ts";
import Desktop from "./Desktop/Desktop.tsx";
import type {UserType} from "./UserSelect/UserSelectionType.ts";

export default function App()
{
	const [scene, setScene] = useState<Scene>("loading");
	const [allowLogin, setAllowLogin] = useState(false);
	const [user, setUser] = useState<UserType>("guest");

	useEffect(() =>
	{
		// Example: auto-finish loading after 2s
		const t = setTimeout(() =>
		{
			setAllowLogin(true);
			setScene("login");
		}, 2000);
		return () => clearTimeout(t);
	}, []);

	const renderScene = (s: Scene) =>
	{
		switch (s)
		{
			case "loading":
				return (
					<div style={{position: "absolute", inset: 0, background: "#0b0d10", zIndex: 50}}>
						<LoadingScreen
							loadTime={1000}
							onComplete={() => setScene(allowLogin ? "login" : "loading")}
							onProgressDone={() => setAllowLogin(true)}
						/>
					</div>
				);

			case "login":
				return (
					<div style={{minHeight: "100vh", background: "#0b0d10"}}>
						<UserSelectPage onLogin={(user: UserType) =>
						{
							switch (user)
							{
								case "guest":
									setScene("desktop")
									break;
								default:
									setScene("terminal")
									break;
							}
						}}/>
					</div>
				);

			case "terminal":
				return (
					<div style={{position: "absolute", inset: 0}}>
						<Terminal SetScene={setScene}/>
					</div>
				);
			case "desktop":
				return (
					<div style={{position: "absolute", inset: 0}}>
						<Desktop SetScene={setScene}/>
					</div>
				)
		}
	};

	return (
		<SceneRouter
			scene={scene}
			durationMs={300}
			ease="cubic-bezier(.2,.8,.2,1)"
			render={renderScene}
		/>
	);
}

function AppInner() {
	const auth = useAuthService();
	const user = useCurrentUser();

	const [loading, setLoading] = useState(true);
	const ranRef = useRef(false);

	// Call auth.me() exactly once after mount (avoid re-running if auth object identity changes)
	useEffect(() =>
	{
		if (ranRef.current) return;
		ranRef.current = true;
		auth.me().finally(() => setLoading(false));
	}, [auth]);

	if (loading) return <p style={{color: "#9ca3af"}}>Loading user…</p>;

	return (
		<main style={{maxWidth: 560, margin: "40px auto", fontFamily: "system-ui, sans-serif", color: "#e5e7eb"}}>
			<h1>Account</h1>

			{!user ? (
				<>
					<LoginForm/>
					<button
						style={{marginTop: 12}}
						onClick={async () =>
						{
							await auth.me();
						}}
					>
						Who am I?
					</button>
					<button
						style={{marginTop: 12}}
						onClick={async () =>
						{
							// Make sure openLogin is actually exported from this module
							const {openLogin} = await import("./auth/LoginController");
							await openLogin();
						}}
					>
						Open login modal
					</button>
				</>
			) : (
				<>
					<div style={{padding: 12, border: "1px solid #2a2f36", borderRadius: 8}}>
						<div>
							<strong>Id:</strong> {user.id}
						</div>
						<div>
							<strong>Email:</strong> {user.email}
						</div>
						<div>
							<strong>DisplayName:</strong> {user.displayName ?? "(none)"}
						</div>
					</div>
					<div style={{marginTop: 12, display: "flex", gap: 8}}>
						<button onClick={() => auth.logout()}>Logout</button>
					</div>
				</>
			)}
		</main>
	);
}
