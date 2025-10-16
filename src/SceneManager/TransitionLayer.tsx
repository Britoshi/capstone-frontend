// TransitionLayer.tsx
import {useEffect, useRef, useState} from "react";

interface TransitionLayerProps
{
	children: React.ReactNode;
	durationMs: number;
	ease: string;
	enterFrom?: { opacity?: number; scale?: number; translateY?: number };
	enterTo?: { opacity?: number; scale?: number; translateY?: number };
	exitTo?: { opacity?: number; scale?: number; translateY?: number };
	role: "in" | "out";
}

export default function TransitionLayer({
											children,
											durationMs,
											ease,
											enterFrom = { opacity: 0, scale: 0.98, translateY: 0 },
											enterTo = { opacity: 1, scale: 1, translateY: 0 },
											exitTo = { opacity: 0, scale: 0.98, translateY: 0 },
											role
										}: TransitionLayerProps)
{
	const [active, setActive] = useState(false);
	const ref = useRef<HTMLDivElement | null>(null);

	useEffect(() =>
	{
		// Mount: start at "from", then promote to "to" next frame
		const el = ref.current;
		if (!el) return;

		// Force starting style
		applyStyle(el, enterFrom, durationMs, ease);

		// Two RAFs: ensure a layout pass before toggling to active
		const r1 = requestAnimationFrame(() =>
		{
			// touch layout to guarantee transition (reflow)
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			el.offsetHeight;
			const r2 = requestAnimationFrame(() => setActive(true));
			return () => cancelAnimationFrame(r2);
		});
		return () => cancelAnimationFrame(r1);
	}, []);

	useEffect(() =>
	{
		const el = ref.current;
		if (!el) return;
		if (role === "out")
		{
			// When used for "out", immediately target exit state
			applyStyle(el, exitTo, durationMs, ease);
			setActive(false);
		}
	}, [role, durationMs, ease, exitTo]);

	const styleNow =
		role === "out"
			? exitTo
			: active
				? enterTo
				: enterFrom;

	return (
		<div
			ref={ref}
			style={{
				position: "absolute",
				inset: 0,
				willChange: "opacity, transform",
				transition: `opacity ${durationMs}ms ${ease}, transform ${durationMs}ms ${ease}`,
				...toCss(styleNow)
			}}
		>
			{children}
		</div>
	);
}

function toCss(s: { opacity?: number; scale?: number; translateY?: number })
{
	const opacity = s.opacity ?? 1;
	const scale = s.scale ?? 1;
	const ty = s.translateY ?? 0;
	return {
		opacity,
		transform: `translateY(${ty}px) scale(${scale})`
	} as const;
}

function applyStyle(el: HTMLDivElement, s: { opacity?: number; scale?: number; translateY?: number }, durationMs: number, ease: string)
{
	const css = toCss(s);
	el.style.opacity = String(css.opacity);
	el.style.transform = css.transform;
	el.style.transition = `opacity ${durationMs}ms ${ease}, transform ${durationMs}ms ${ease}`;
}
