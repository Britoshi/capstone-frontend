import {useState, useRef, useEffect} from "react";
import UserIcon from "./UserIcon";
import type {UserType} from "./UserSelectionType.ts";
import bg from "../assets/loginpage-bg.jpg";
import {VISIT_KEY} from "../prefs.ts";

interface UserSelectProps {
	onLogin?: (type: UserType) => void;
}

const fadeMs = 700;

export default function UserSelectPage({onLogin}: UserSelectProps) {
	// First-load detection (lazy init to avoid extra renders)
	const initialType = (): UserType => {
		if (typeof window === "undefined") return "guest"; // SSR safety
		const seen = window.localStorage.getItem(VISIT_KEY);
		return seen ? "none" as UserType : "guest";
	};

	const [selection, setSelection] = useState<UserType>(initialType);
	const [confirm, setConfirm] = useState<UserType>(initialType);

	// Mark as visited once mounted (so subsequent loads use "none")
	useEffect(() => {
		if (typeof window !== "undefined") {
			window.localStorage.setItem(VISIT_KEY, "1");
		}
	}, []);

	// 🔑 Reference to the icon container
	const iconContainerRef = useRef<HTMLDivElement>(null);

	const resetOnOutside = (e: React.PointerEvent<HTMLDivElement>) => {
		const container = iconContainerRef.current;
		if (!container) return;
		if (!container.contains(e.target as Node)) {
			if (confirm !== "none") setConfirm("none");
			else if (selection !== "none") setSelection("none");
		}
	};

	const OnLoad = () => {
		onLogin?.(confirm);
	};

	return (
		<div
			onPointerDown={resetOnOutside}
			className="w-screen h-screen flex flex-col items-center justify-center bg-[#0b0d10] text-neutral-200"
			style={{
				transition: `opacity ${fadeMs}ms ease`,
				background: "transparent",
				backgroundImage: `url(${bg})`,
				backgroundSize: "cover",
				backgroundPosition: "center",
				backgroundRepeat: "no-repeat",
			}}
		>
			{/* blur overlay - make sure clicks pass through */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					backdropFilter: "blur(12px)",
					WebkitBackdropFilter: "blur(12px)",
					backgroundColor: "rgba(0,0,0,0.2)",
					pointerEvents: "none",
				}}
			/>

			<div
				ref={iconContainerRef}
				onPointerDown={(e) => e.stopPropagation()} // 🔑 don't bubble to the outer handler
				className="flex gap-10 h-0"
				style={{ position: "fixed", top: "25%" }}
			>
				<UserIcon
					selectionType="dev"
					label="DEV"
					selection={selection}
					setSelection={setSelection}
					confirm={confirm}
					setConfirm={setConfirm}
					onLoad={OnLoad}
				/>
				<UserIcon
					selectionType="guest"
					label="GUEST"
					selection={selection}
					setSelection={setSelection}
					confirm={confirm}
					setConfirm={setConfirm}
					onLoad={OnLoad}
				/>
				<UserIcon
					selectionType="login"
					label="USER"
					selection={selection}
					setSelection={setSelection}
					confirm={confirm}
					setConfirm={setConfirm}
					onLoad={OnLoad}
				/>
			</div>
		</div>
	);
}
