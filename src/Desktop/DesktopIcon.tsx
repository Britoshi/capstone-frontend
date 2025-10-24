// DesktopIcon.tsx
import {type JSX, useEffect, useRef, useState} from "react";

export interface DesktopIconProps {
    id: string;								// NEW: stable id from Desktop
    label: string;
    imageUrl?: string;
    OpenPage: JSX.Element;
    desktopInsetBottomPx?: number;
    selected?: boolean;					// NEW: controlled selection
    onSelect?: (id: string) => void;	// NEW: notify Desktop on single-click
}

type Phase = "idle" | "opening" | "open" | "closing";

const DURATION_MS = 200;
const EASING = "cubic-bezier(0.2, 0.8, 0.2, 1)";

export default function DesktopIcon({
                                        id, label, imageUrl, OpenPage,
                                        desktopInsetBottomPx = 48,
                                        selected = false,
                                        onSelect
                                    }: DesktopIconProps) {
    const [hover, setHover] = useState(false);
    const [phase, setPhase] = useState<Phase>("idle");
    const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
    const [boxStyle, setBoxStyle] = useState<React.CSSProperties>({});
    const [contentStyle, setContentStyle] = useState<React.CSSProperties>({});
    const [overlayOpacity, setOverlayOpacity] = useState(0);

    const iconRef = useRef<HTMLDivElement | null>(null);
    const timerRef = useRef<number | null>(null);

    const clearTimer = () => {
        if (timerRef.current !== null) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };
    useEffect(() => () => clearTimer(), []);

    const getIconRect = () => {
        if (!iconRef.current) return null;
        const r = iconRef.current.getBoundingClientRect();
        return {top: r.top, left: r.left, width: r.width, height: r.height};
    };

    const targetHeight = () => Math.max(0, window.innerHeight - desktopInsetBottomPx);

    const openFromIcon = () => {
        if (phase === "opening" || phase === "open") return;
        const r = getIconRect();
        if (!r) return;

        setRect(r);
        setPhase("opening");
        setOverlayOpacity(0);
        setBoxStyle({
            position: "fixed",
            zIndex: 35,
            top: r.top, left: r.left, width: r.width, height: r.height,
            borderRadius: 16,
            background: "white",
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            overflow: "hidden",
            opacity: 0,
            transition: [
                `top ${DURATION_MS}ms ${EASING}`,
                `left ${DURATION_MS}ms ${EASING}`,
                `width ${DURATION_MS}ms ${EASING}`,
                `height ${DURATION_MS}ms ${EASING}`,
                `border-radius ${DURATION_MS}ms ${EASING}`,
                `opacity ${DURATION_MS}ms ${EASING}`,
            ].join(", "),
        });
        setContentStyle({
            opacity: 0,
            filter: "blur(6px)",
            clipPath: "inset(2% 2% 2% 2% round 12px)",
            transition: `opacity ${DURATION_MS}ms ${EASING}, filter ${DURATION_MS}ms ${EASING}, clip-path ${DURATION_MS}ms ${EASING}`,
            willChange: "opacity, filter, clip-path",
            height: "100%",
            display: "flex",
            flexDirection: "column",
        });

        requestAnimationFrame(() => {
            setBoxStyle((s) => ({
                ...s,
                top: 0,
                left: 0,
                width: "100vw",
                height: targetHeight(),
                borderRadius: 0,
                opacity: 1
            }));
            setOverlayOpacity(1);
            setContentStyle((cs) => ({...cs, opacity: 1, filter: "blur(0px)", clipPath: "inset(0% 0% 0% 0%)"}));
        });

        clearTimer();
        timerRef.current = window.setTimeout(() => {
            setPhase("open");
        }, DURATION_MS);
    };

    const closeToIcon = () => {
        if (phase !== "open") return;
        const r = rect ?? getIconRect();
        if (!r) {
            setPhase("idle");
            setOverlayOpacity(0);
            return;
        }

        setPhase("closing");
        setContentStyle((cs) => ({...cs, opacity: 0, filter: "blur(6px)", clipPath: "inset(2% 2% 2% 2% round 12px)"}));
        setOverlayOpacity(0);

        requestAnimationFrame(() => {
            setBoxStyle((s) => ({
                ...s,
                top: r.top,
                left: r.left,
                width: r.width,
                height: r.height,
                borderRadius: 16,
                opacity: 0
            }));
        });

        clearTimer();
        timerRef.current = window.setTimeout(() => {
            setPhase("idle");
        }, DURATION_MS);
    };

    // Maintain target height on resize
    useEffect(() => {
        const onResize = () => {
            if (phase === "opening" || phase === "open") {
                setBoxStyle((s) => ({...s, height: targetHeight()}));
            }
        };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, [phase, desktopInsetBottomPx]);

    const showWindow = phase === "opening" || phase === "open" || phase === "closing";

    return (
        <>
            <div
                ref={iconRef}
                onClick={() => onSelect?.(id)}                    // single-click selects (Desktop controls state)
                onDoubleClick={openFromIcon}                        // double-click opens
                className={`
					group flex flex-col items-center justify-start
					select-none rounded-2xl active:scale-[0.98]
					shadow-sm transition outline-none
					w-[96px] h-[96px] px-1 pt-1
					${selected ? "ring-2 ring-sky-500/70 ring-offset-0" : ""}
				`}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
                style={{
                    backgroundColor: (hover || selected) ? "rgba(65,65,65,0.6)" : "rgba(65,65,65,0.2)",
                    transition: "background-color 0.15s ease",
                }}
                onMouseDown={(e) => e.detail > 1 && e.preventDefault()}
            >
                {imageUrl ? (
                    <img src={imageUrl} alt={label} className="w-14 h-14 rounded-md object-cover mt-1"/>
                ) : (
                    <div className="text-2xl mt-1">🗂️</div>
                )}

                <span
                    className="mt-1 text-[11px] leading-tight text-zinc-200 text-center w-full whitespace-normal"
                    style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        wordBreak: "break-word",
                    }}
                >
					{label}
				</span>
            </div>

            {showWindow && (
                <div
                    className="fixed left-0 right-0 z-30"
                    style={{
                        top: 0,
                        height: targetHeight(),
                        background: "rgba(0,0,0,0.40)",
                        opacity: overlayOpacity,
                        transition: `opacity ${DURATION_MS}ms ${EASING}`,
                        pointerEvents: phase === "open" ? "auto" : "none",
                    }}
                />
            )}

            {showWindow && (
                <div className="pointer-events-auto" style={boxStyle} onClick={(e) => e.stopPropagation()}>
                    <div style={{
                        width: "100%",
                        height: 44,
                        backgroundColor: "gray",
                        color: "black",
                        display: "flex",
                        alignItems: "center"
                    }} className="px-4">
                        <div className="flex justify-between items-center w-full">
                            <h2 className="text-lg font-semibold">{label}</h2>
                            <button onClick={closeToIcon}
                                    className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-red-600 rounded transition"
                                    title="Close">✕
                            </button>
                        </div>
                    </div>
                    <div style={contentStyle}>
                        <div className="w-full" style={{height: `calc(100% - 44px)`, overflow: "auto"}}>
                            {OpenPage}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
