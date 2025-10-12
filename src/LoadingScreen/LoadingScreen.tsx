import { useEffect, useRef, useState } from "react";
import "./LoadingScreen.css";

interface LoadingProps {
	loadTime?: number;        // ms
	onComplete?: () => void;  // called AFTER exit animation finishes
	fadeMs?: number;          // fade-out duration in ms (must match CSS/inline)
	onProgressDone?: () => void;
}

type Phase = "loading" | "exiting" | "done";

export default function LoadingScreen({
										  loadTime = 2000,
										  onComplete,
										  fadeMs = 700,
										  onProgressDone
									  }: LoadingProps) {
	const [progress, setProgress] = useState(0);
	const [phase, setPhase] = useState<Phase>("loading");
	const rootRef = useRef<HTMLDivElement | null>(null);
	const calledRef = useRef(false); // guard against multiple calls

	// time-based progress
	useEffect(() => {
		const start = performance.now();
		let raf = 0;
		const tick = (t: number) => {
			const ratio = Math.min(1, (t - start) / loadTime);
			setProgress(ratio);
			if (ratio < 1) raf = requestAnimationFrame(tick);
			else
			{
				setPhase("exiting"); // ✅ start fade-out instead of completing immediately
				onProgressDone?.();
			}
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [loadTime]);

	// When the fade-out transition finishes, call onComplete
	useEffect(() => {
		const el = rootRef.current;
		if (!el) return;

		const handleEnd = (e: TransitionEvent | AnimationEvent) => {
			// Only react when we're exiting and the opacity transition finished
			if (phase !== "exiting") return;
			// For safety, check propertyName if it's a TransitionEvent
			// (AnimationEvent doesn't have propertyName, so allow both)
			// @ts-ignore
			if ("propertyName" in e && e.propertyName && e.propertyName !== "opacity") return;

			if (!calledRef.current) {
				calledRef.current = true;
				setPhase("done");
				onComplete?.();
			}
		};

		el.addEventListener("transitionend", handleEnd as any);
		el.addEventListener("animationend", handleEnd as any);
		return () => {
			el.removeEventListener("transitionend", handleEnd as any);
			el.removeEventListener("animationend", handleEnd as any);
		};
	}, [phase, onComplete]);

	// Reduced-motion users: skip animation and complete immediately
	useEffect(() => {
		const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
		if (mq.matches && phase === "exiting" && !calledRef.current) {
			calledRef.current = true;
			setPhase("done");
			onComplete?.();
		}
	}, [phase, onComplete]);

	// Compute classes/styles for fade-out
	const isHidden = phase === "exiting" || phase === "done";

	// If phase is done, render nothing
	if (phase === "done") return null;

	return (
		<div
			ref={rootRef}
			className="w-screen h-screen flex flex-col items-center justify-center bg-[#0b0d10] text-neutral-200"
			style={{
				// IMPORTANT: transition must include opacity to catch 'transitionend'
				transition: `opacity ${fadeMs}ms ease`,
				opacity: isHidden ? 0 : 1,
				pointerEvents: isHidden ? "none" : "auto",
			}}
			aria-hidden={isHidden}
		>
			{/* Your loader animation */}
			<div
				className="loader mb-6"
				style={{ alignItems: "center", filter: "invert(1) brightness(1.2)" }}
			/>

			<h1 className="font-mono text-xl tracking-wide text-emerald-400 mb-4">
				Loading Britoland…
			</h1>

			<div className="mt-2 w-64 h-2 bg-neutral-800 rounded-full overflow-hidden shadow-inner">
				<div
					className="h-full bg-emerald-400 transition-[width] duration-100 ease-linear"
					style={{ width: `${Math.round(progress * 100)}%` }}
				/>
			</div>

			<p className="mt-3 font-mono text-sm text-neutral-500">
				{`${Math.round(progress * 100)}%`}
			</p>
		</div>
	);
}
