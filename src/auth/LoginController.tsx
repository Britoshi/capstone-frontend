// src/auth/loginController.tsx
import React, {useEffect, useState} from "react";
import {createRoot} from "react-dom/client";
import {AuthProvider} from "./AuthProvider";
import {LoginForm} from "./LoginForm";
import bg from "../assets/login-bg.jpg";

const outline = (px: number, color: string) =>
	[
		`${-px}px ${-px}px 0 ${color}`,
		`${px}px ${-px}px 0 ${color}`,
		`${-px}px ${px}px 0 ${color}`,
		`${px}px ${px}px 0 ${color}`
	].join(", ");

// eslint-disable-next-line react-refresh/only-export-components
export function openLogin(): Promise<boolean> {
	const host = document.createElement("div");
	Object.assign(host.style, {position: "fixed", inset: "0", zIndex: "9999"});
	document.body.appendChild(host);
	const root = createRoot(host);

	return new Promise<boolean>((resolve) =>
	{
		const close = (ok: boolean) =>
		{
			root.unmount();
			host.remove();
			resolve(ok);
		};

		root.render(
			<AuthProvider>
				<Modal onClose={() => close(false)} onOk={() => close(true)}>
					{/* Left pane */}
					<div style={{textAlign: "center", color: "#FFF"}}>
						<h1 style={{marginTop: 0, marginBottom: 0, textShadow: outline(1, "#000")}}>Welcome</h1>
						<h2 style={{marginTop: 0, textShadow: outline(1, "#000")}}>User of the Internets</h2>
						<p style={{marginTop: 0, textShadow: outline(1, "#000")}}>You will sign in here.</p>
					</div>

					<LoginForm onSuccess={() => close(true)}/>
				</Modal>
			</AuthProvider>
		);
	});
}
// Timing
const FADE_IN = .25;   // seconds
const FADE_OUT = .15;  // seconds
const EXPAND_MS = 350; // left-pane expand animation
const HOLD_MS = 1400;   // how long to keep success message before fading out

// eslint-disable-next-line react-refresh/only-export-components
const Modal: React.FC<React.PropsWithChildren<{ onClose: () => void; onOk?: () => void }>> =
	({onClose, onOk, children}) =>
	{
		const [visible, setVisible] = useState(false);
		const [closing, setClosing] = useState(false);
		const [successKind, setSuccessKind] = useState<null | "login" | "register">(null);
		const [successAnim, setSuccessAnim] = useState(false);
		const successRunning = successKind !== null;

		// manage timers so we don't leak on unmount
		useEffect(() =>
		{
			const id = requestAnimationFrame(() => setVisible(true));
			return () => cancelAnimationFrame(id);
		}, []);

		useEffect(() => {
			if (successKind) {
				// wait one frame before animating
				const id = requestAnimationFrame(() => setSuccessAnim(true));
				return () => cancelAnimationFrame(id);
			} else {
				setSuccessAnim(false);
			}
		}, [successKind]);

		useEffect(() =>
		{
			let t1: number | undefined;
			let t2: number | undefined;

			// After success: expand -> hold -> fade modal out -> resolve
			if (successRunning)
			{
				// After the expand finishes + hold, start fade-out of the whole modal
				t1 = window.setTimeout(() =>
				{
					setClosing(true);          // triggers backdrop/container fade (visible -> false)
					setVisible(false);

					// After fade-out completes, resolve OK
					t2 = window.setTimeout(() => { onOk?.(); }, FADE_OUT * 1000);
				}, EXPAND_MS + HOLD_MS);
			}

			return () =>
			{
				if (t1) clearTimeout(t1);
				if (t2) clearTimeout(t2);
			};
		}, [successRunning, onOk]);

		const handleClose = () =>
		{
			// Ignore manual close while success sequence is running
			if (successRunning) return;

			setClosing(true);
			setVisible(false);
			setTimeout(onClose, FADE_OUT * 1000);
		};

		// Split children: first = left, second = right
		const nodes = React.Children.toArray(children);
		const left = nodes[0] ?? null;
		let right = nodes[1] ?? null;

		// Inject onSuccess(kind) into right child (LoginForm)
		if (React.isValidElement(right))
		{
			right = React.cloneElement(right as React.ReactElement<any>, {
				onSuccess: (kind: "login" | "register") => setSuccessKind(kind)
			});
		}

		const headline =
			successKind === "login" ? "Welcome back!" :
				successKind === "register" ? "Welcome!" :
					null;

		return (
			<div
				onClick={handleClose}
				style={{
					position: "fixed",
					inset: 0,
					background: "rgba(0,0,0,.45)",
					display: "grid",
					placeItems: "center",
					opacity: visible ? 1 : 0,
					transition: `opacity ${closing ? FADE_OUT : FADE_IN}s ease-in-out`,
					pointerEvents: closing ? "none" : "auto"   // block stray clicks during fade
				}}
			>

				<div
					onClick={e => e.stopPropagation()}
					style={{
						position: "relative",
						background: "#fff",
						borderRadius: 16,
						padding: 0,
						width: successAnim ? "70vw":"90vw",
						height: successAnim ? "30vh":"80vh",
						maxWidth: "1000px",
						boxShadow: "0 2px 20px rgba(0,0,0,0.3)",
						overflow: "hidden",
						transform: visible ? "scale(1)" : "scale(0.97)",
						transition: [
							`transform ${closing ? FADE_OUT : FADE_IN}s ease-in-out`,
							`grid-template-columns ${EXPAND_MS}ms ease`,
							"opacity .7s ease",
							"width .4s ease",
							"height .4s ease",
						].join(", "),
						display: "grid",
						gridTemplateColumns: successRunning ? "1fr 0fr" : "1fr 1fr",
						alignItems: "stretch",
						opacity: 1, // fade out when successAnim true
					}}
				>
					{/* Left pane with bg */}
					<div
						style={{
							minHeight: 0,
							minWidth: 0,
							overflow: "auto",
							alignContent: "center",
							backgroundImage: `url(${bg})`,
							backgroundSize: "cover",
							backgroundPosition: "center",
							backgroundRepeat: "no-repeat",
							width: "100%",
							height: "100%",
							padding: 24,
							paddingRight: 8,
							// backgroundColor: successAnim ? "rgba(0,0,0,1)" : "transparent",
							backgroundBlendMode: "multiply",	// or "overlay", "darken"
							transition: "background-color .7s ease",
							color: "#fff"
						}}
					>
						{!headline && left}
					</div>

					{/* Right pane: fade out & disable on success */}
					<div
						style={{
							minHeight: 0,
							minWidth: 0,
							height: "100%",
							width: "100%",
							display: "flex",
							flexDirection: "column",
							overflow: "hidden",
							background: "#fff",
							opacity: successRunning ? 0 : 1,
							pointerEvents: successRunning ? "none" : "auto",
							transition: `opacity ${EXPAND_MS}ms ease`
						}}
					>
						{right}
					</div>

					{/* Close button: disabled during success/closing */}
					<button
						onClick={handleClose}
						aria-label="Close"
						disabled={successRunning || closing}
						style={{
							position: "absolute",
							top: 10,
							right: 10,
							border: "none",
							background: "transparent",
							fontSize: 20,
							lineHeight: 1,
							cursor: successRunning || closing ? "not-allowed" : "pointer",
							padding: 6,
							color: "#000",
							opacity: successRunning || closing ? 0.5 : 1
						}}
					>
						×
					</button>
				</div>
				{headline && (
					<div
						style={{
							textAlign: "center",
							position: "absolute",
							width: "100%",
							height: "100%",
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
							transition: "all 0.6s ease",
						}}
					>
						<h1
							style={{
								margin: 0,
								textShadow: outline(2, "#000"),
								fontSize: successAnim ? "4rem" : "2rem",
								opacity: successAnim ? 1 : 0,
								transform: successAnim ? "scale(1.5)" : "scale(1)",
								transition: ["all 0.35s ease",
									"opacity 1.0s ease"].join(", "),
							}}
						>
							{headline}
						</h1>
						<p
							style={{
								marginTop: 8,
								textShadow: outline(1, "#000"),
								fontSize: successAnim ? "1.4rem" : "1rem",
								opacity: successAnim ? 1 : 0,
								transform: successAnim ? "scale(1.1)" : "scale(1)",
								transition: "all 0.4s ease",
							}}
						>
							{successKind === "login" ? "Good to see you again." : "Your account is ready."}
						</p>
					</div>
				)}
			</div>
		);
	};

export default Modal;
