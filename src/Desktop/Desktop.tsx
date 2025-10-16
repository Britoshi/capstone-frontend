// Desktop.tsx (only Desktop changes; no DesktopIcon edits)
import {useEffect, useRef, useState} from "react";
import type {Scene} from "../SceneManager/Scenes.ts";
import Backdrop from "../Elements/Backdrop.tsx";
import DesktopIcon from "./DesktopIcon.tsx";
import portfolioIcon from "../assets/icons/portfolio.png";
import bg from "../assets/desktop-bg.jpg";

export default function Desktop({ SetScene }:
								{ SetScene: React.Dispatch<React.SetStateAction<Scene>> })
{
	const MENU_MS = 160;

	const [startOpen, setStartOpen] = useState(false);
	const [menuMounted, setMenuMounted] = useState(false);
	const [menuVisible, setMenuVisible] = useState(false); // drives the animation
	const menuRef = useRef<HTMLDivElement | null>(null);
	const startBtnRef = useRef<HTMLButtonElement | null>(null);

	// Mount/unmount with guaranteed enter/exit animation
	useEffect(() =>
	{
		let raf1 = 0;
		let raf2 = 0;
		let to: number | null = null;

		if (startOpen)
		{
			// 1) mount at opacity 0 / translated
			setMenuMounted(true);
			setMenuVisible(false);

			// 2) ensure the initial style gets painted, then flip to visible
			raf1 = requestAnimationFrame(() =>
			{
				raf2 = requestAnimationFrame(() => setMenuVisible(true));
			});
		}
		else
		{
			// start closing animation
			setMenuVisible(false);
			// unmount after the transition finishes
			to = window.setTimeout(() => setMenuMounted(false), MENU_MS);
		}

		return () =>
		{
			if (raf1) cancelAnimationFrame(raf1);
			if (raf2) cancelAnimationFrame(raf2);
			if (to !== null) window.clearTimeout(to);
		};
	}, [startOpen]);

	// Close on outside click / Esc
	useEffect(() =>
	{
		function onDocClick(e: MouseEvent)
		{
			if (!menuMounted) return;
			const t = e.target as Node;
			if (menuRef.current && !menuRef.current.contains(t) && startBtnRef.current && !startBtnRef.current.contains(t))
			{
				setStartOpen(false);
			}
		}
		function onKey(e: KeyboardEvent)
		{
			if (e.key === "Escape") setStartOpen(false);
		}
		document.addEventListener("mousedown", onDocClick);
		document.addEventListener("keydown", onKey);
		return () =>
		{
			document.removeEventListener("mousedown", onDocClick);
			document.removeEventListener("keydown", onKey);
		};
	}, [menuMounted]);

	const [now, setNow] = useState(new Date());
	useEffect(() =>
	{
		const id = setInterval(() => setNow(new Date()), 1000);
		return () => clearInterval(id);
	}, []);

	return (
		<Backdrop bg={bg} style={{ width: "100vw", height: "100vh", color: "white" }}>
			{/* Desktop area (unchanged) */}
			<div
				className="grid grid-flow-col place-content-start overflow-auto p-3 pb-16 pointer-events-auto relative z-0"
				style={{
					gridAutoFlow: "column",
					gridAutoRows: "96px",
					gridTemplateColumns: "repeat(auto-fill, 112px)",
					gap: "12px"
				}}
			>
				<DesktopIcon key="portfolio" label="Portfolio" imageUrl={portfolioIcon} OpenPage={<div>📁 Project files here</div>} />
				<DesktopIcon key="music" label="Music" imageUrl="/icons/music.png" OpenPage={<div>🎵 My music player UI</div>} />
				<DesktopIcon key="notes" label="Notes" imageUrl="/icons/note.png" OpenPage={<div>📝 Notes window content</div>} />
			</div>

			{/* Taskbar (simple toggle behavior) */}
			<div className="fixed bottom-0 left-0 right-0 h-12 bg-black/60 backdrop-blur-sm border-t border-white/10 flex items-center px-2 z-40 pointer-events-auto">
				<button
					ref={startBtnRef}
					type="button"
					aria-haspopup="menu"
					aria-expanded={startOpen}
					onClick={(e) =>
					{
						e.stopPropagation();
						setStartOpen(open => !open); // true toggle
					}}
					className="h-9 px-3 rounded-md bg-white/10 hover:bg-white/20 active:bg-white/25 transition flex items-center gap-2 select-none"
				>
					<span className="text-lg">⊞</span>
					<span className="text-sm font-medium">Start</span>
				</button>

				<div className="ml-2 h-6 w-px bg-white/10" />
				<div className="ml-2 flex-1" />

				<div className="text-xs text-white/80 pr-2" aria-label="System time">
					{now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
				</div>
			</div>

			{/* Start menu with guaranteed enter/exit animation */}
			{menuMounted && (
				<div
					ref={menuRef}
					role="menu"
					aria-label="Start menu"
					className="fixed bottom-12 left-2 w-64 max-h-[60vh] overflow-auto rounded-lg border border-white/10 bg-zinc-900/95 shadow-2xl backdrop-blur p-2 z-50 pointer-events-auto"
					style={{
						opacity: menuVisible ? 1 : 0,
						transform: menuVisible ? "translateY(0) scale(1)" : "translateY(8px) scale(0.98)",
						transition: `opacity ${MENU_MS}ms ease, transform ${MENU_MS}ms ease`,
						transformOrigin: "bottom left",
						willChange: "opacity, transform",
						pointerEvents: menuVisible ? "auto" : "none",
					}}
				>
					<button className="w-full text-left px-3 py-2 rounded hover:bg-white/10 transition">📁 Files</button>
					<button className="w-full text-left px-3 py-2 rounded hover:bg-white/10 transition">🎵 Music</button>
					<button className="w-full text-left px-3 py-2 rounded hover:bg-white/10 transition">📝 Notes</button>
					<div className="my-2 h-px bg-white/10" />
					<button className="w-full text-left px-3 py-2 rounded hover:bg-white/10 transition">⚙️ Settings</button>
					<button className="w-full text-left px-3 py-2 rounded hover:bg-white/10 transition">🔍 Search</button>
					<div className="my-2 h-px bg-white/10" />
					<button
						type="button"
						onClick={() => { setStartOpen(false); SetScene("login"); }}
						className="w-full text-left px-3 py-2 rounded hover:bg-white/10 transition"
					>⏻ Power</button>
				</div>
			)}
		</Backdrop>
	);
}
