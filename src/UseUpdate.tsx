import { useEffect, useRef } from "react";

type UpdateInfo = {
	/** Seconds since previous frame */
	dt: number;
	/** Milliseconds since first frame */
	elapsedMs: number;
	/** High-res now (performance.now) */
	now: number;
};

export function useUpdate(
	onUpdate: (u: UpdateInfo) => void,
	enabled: boolean = true,
	{ pauseWhenHidden = true }: { pauseWhenHidden?: boolean } = {}
) {
	const cbRef = useRef(onUpdate);
	cbRef.current = onUpdate;

	useEffect(() => {
		if (!enabled) return;

		let raf = 0;
		let start = performance.now();
		let prev = start;
		let paused = false;

		const visHandler = () => {
			if (!pauseWhenHidden) return;
			if (document.hidden) {
				paused = true;
			} else {
				// reset timers when resuming so dt doesn't spike
				const now = performance.now();
				start = now;
				prev = now;
				paused = false;
			}
		};

		if (pauseWhenHidden) {
			document.addEventListener("visibilitychange", visHandler);
		}

		const loop = (now: number) => {
			if (!paused) {
				const dt = (now - prev) / 1000;
				const elapsedMs = now - start;
				prev = now;
				cbRef.current({ dt, elapsedMs, now });
			}
			raf = requestAnimationFrame(loop);
		};

		raf = requestAnimationFrame(loop);
		return () => {
			cancelAnimationFrame(raf);
			if (pauseWhenHidden) {
				document.removeEventListener("visibilitychange", visHandler);
			}
		};
	}, [enabled, pauseWhenHidden]);
}
