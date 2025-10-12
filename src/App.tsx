// src/App.tsx
import {useEffect, useState} from "react";
import {AuthProvider, useAuthService, useCurrentUser} from "./auth/AuthProvider";
import {LoginForm} from "./auth/LoginForm";
import LoadingScreen from "./LoadingScreen/LoadingScreen.tsx";
import Terminal from "./Terminal.tsx";

function AppInner() {
	const auth = useAuthService();
	const user = useCurrentUser();
	const [loading, setLoading] = useState(true);

	useEffect(() => { auth.me().finally(() => setLoading(false)); }, [auth]);

	if (loading) return <p>Loading…</p>;

	return (
		<main style={{maxWidth: 560, margin: "40px auto", fontFamily: "system-ui, sans-serif"}}>
			<h1>Account</h1>

			{!user ? (
				<>
					<LoginForm/>
					<button style={{marginTop: 12}} onClick={async () => { await auth.me(); }}>
						Who am I?
					</button>
				</>
			) : (
				<>
					<div style={{padding: 12, border: "1px solid #eee", borderRadius: 8}}>
						<div><strong>Id:</strong> {user.id}</div>
						<div><strong>Email:</strong> {user.email}</div>
						<div><strong>DisplayName:</strong> {user.displayName ?? "(none)"} </div>
					</div>
					<div style={{marginTop: 12, display: "flex", gap: 8}}>
						<button onClick={() => auth.logout()}>Logout</button>
						<button onClick={async () =>
						{
							const {openLogin} = await import("./auth/LoginController");
							await openLogin();
						}}>
							Open login modal
						</button>
					</div>
				</>
			)}
		</main>
	);
}

function OnLoadingComplete() {
	alert("HI");
}

export default function App()
{
	const [ready, setReady] = useState(false);
	const [removeLoad, setRemoveLoad] = useState(false);
	return (
		<div>
			<div style={{position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 1}}>
				{!ready && <LoadingScreen loadTime={2000} fadeMs={700} onComplete={() => setReady(true)}
                                          onProgressDone={() => setRemoveLoad(true)}/>
				}

			</div>

			<div style={{position: 'absolute', top: 0, left: 0, width: '100%'}}>
				{removeLoad && <Terminal/>}
			</div>
			{/* your terminal component */}
		</div>
	);
}
