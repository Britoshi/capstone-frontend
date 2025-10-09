// src/auth/LoginForm.tsx
import React, {useState} from "react";
import {useAuthService} from "./AuthProvider";

export const LoginForm: React.FC<{ onSuccess?: (kind: "login" | "register") => void }> = ({onSuccess}) =>
{
	const auth = useAuthService();
	const [isRegister, setIsRegister] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [displayName, setDisplayName] = useState("");
	const [loading, setLoading] = useState(false);
	const [err, setErr] = useState<string | null>(null);

	async function doLogin() {
		setLoading(true);
		setErr(null);
		try
		{
			await auth.login(email.trim(), password);
			onSuccess?.("login");
		}
		catch (e: any)
		{ setErr(e?.message ?? "Login failed"); }
		finally
		{ setLoading(false); }
	}

	async function doRegister() {
		setLoading(true);
		setErr(null);
		try
		{
			await auth.register(email.trim(), password, displayName.trim() || undefined);
			onSuccess?.("register");
		}
		catch (e: any)
		{ setErr(e?.message ?? "Registration failed"); }
		finally
		{ setLoading(false); }
	}

	const container: React.CSSProperties = {
		position: "relative",
		flex: 1,				// ← fills RightPane
		width: "100%",
		height: "100%",
		display: "grid",
		placeItems: "center",
		background: "#fff",
		color: "#000",
		overflow: "auto"
	};

	const panel: React.CSSProperties = {
		position: "absolute",
		inset: 0,
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		padding: 32,
		transition: "opacity .25s ease",
		background: "#fff"
	};
	const input: React.CSSProperties = {
		width: 280,
		border: "1px solid #ccc",
		borderRadius: 8,
		padding: "10px 12px",
		marginBottom: 10
	};
	const button: React.CSSProperties = {
		width: 280,
		border: "none",
		borderRadius: 8,
		padding: "10px 14px",
		fontWeight: 600,
		cursor: "pointer",
		background: "#000",
		color: "#fff",
		marginTop: 8
	};
	const link: React.CSSProperties = {
		marginTop: 12,
		border: "none",
		background: "none",
		color: "#000",
		textDecoration: "underline",
		cursor: "pointer"
	};

	return (
		<div style={container}>
			{/* LOGIN */}
			<div style={{...panel, opacity: isRegister ? 0 : 1, pointerEvents: isRegister ? "none" : "auto"}}>
				<h2>Sign In</h2>
				<input style={input} value={email} onChange={e => setEmail(e.target.value)} placeholder="Email"
					   type="email"/>
				<input style={input} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password"
					   type="password"/>
				{err && <p style={{color: "#b00020"}}>{err}</p>}
				<button style={button} onClick={doLogin} disabled={loading}>{loading ? "…" : "Login"}</button>
				<button style={link} onClick={() => setIsRegister(true)}>Create an account</button>
			</div>

			{/* REGISTER */}
			<div style={{...panel, opacity: isRegister ? 1 : 0, pointerEvents: isRegister ? "auto" : "none"}}>
				<h2>Register</h2>
				<input style={input} value={email} onChange={e => setEmail(e.target.value)} placeholder="Email"
					   type="email"/>
				<input style={input} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password"
					   type="password"/>
				<input style={input} value={displayName} onChange={e => setDisplayName(e.target.value)}
					   placeholder="Display name (optional)"/>
				{err && <p style={{color: "#b00020"}}>{err}</p>}
				<button style={button} onClick={doRegister} disabled={loading}>{loading ? "…" : "Register"}</button>
				<button style={link} onClick={() => setIsRegister(false)}>Back to Login</button>
			</div>
		</div>
	);
};
