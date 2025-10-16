import type {UserType} from "./UserSelectionType.ts";
import guestImage from "../assets/guest.png";
import "./Loader.css";
import {useUpdate} from "../UseUpdate.tsx";
import {useState} from "react";


interface UserIconProps
{
	selectionType: UserType;
	label?: string;
	selection: UserType;
	setSelection: React.Dispatch<React.SetStateAction<UserType>>
	confirm: UserType;
	setConfirm: React.Dispatch<React.SetStateAction<UserType>>;
	onLoad: () => void;
}

const tTime = 300
const confirmLoadingTime = 2

export default function UserIcon({selectionType, label, selection, setSelection, confirm, setConfirm, onLoad}: UserIconProps)
{
	const [confirmTimer, setConfirmTimer] = useState<number>(0);

	const isSelected = selection == selectionType;
	const isConfirmed = confirm == selectionType;

	const full = 90;
	const big = 70;
	const small = 25;
	const delta = (big - small) / 2; // 50

	useUpdate(({ dt, elapsedMs }) => {
		if(isConfirmed)
		{
			setConfirmTimer(confirmTimer + dt);
			if(confirmTimer > confirmLoadingTime)
			{
				onLoad();
				setConfirmTimer(-10000);
			}
		}
	}, true);

	const onClick = () =>
	{

		if (confirm != 'none' && !isConfirmed)
		{
			setConfirm('none')
			return;
		}
		if (!isSelected)
		{
			setSelection(selectionType)
			setConfirm("none")
		}
		else
		{
			setConfirm(selectionType)
			setConfirmTimer(0)
		}
	}

	return (
		<div
			className="rounded-3xl flex flex-col items-center justify-center
                 bg-amber-100/10 hover-none"
			style={{
				opacity: isConfirmed || (confirm == "none") ? 1 : 0,
				// 🔑 Explicitly transition the properties we’re changing
				outline: "none",
				transition: `width ${tTime}ms ease-in-out, height ${tTime}ms ease-in-out, margin ${tTime}ms ease-in-out, opacity ${tTime}ms ease-in-out`,
				width: isConfirmed ? `${full}vh` : isSelected ? `${big / 1.3}vh` : `${small}vh`,
				height: isConfirmed ? `${full}vh` : isSelected ? `${big}vh` : `${small}vh`,
				marginTop: isSelected ? `${-delta}vh` : 0,
				// (optional) hint
				willChange: "width, height, margin",
				backdropFilter: "blur(12px)",
				WebkitBackdropFilter: "blur(12px)",
				backgroundColor: "rgba(10, 10, 10, 0.1)", // translucent amber tint
			}}
			onClick={onClick}
		>
			<div
				className="rounded-full bg-amber-200 mb-2 flex items-center justify-center"
				style={{
					width: isSelected ? "85%" : "65%",
					aspectRatio: "1 / 1",
					transition: `all ${tTime}ms ease-in-out`,
					backgroundImage: `url(${guestImage})`,
					backgroundSize: "cover",
					backgroundPosition: "center",
					backgroundRepeat: "no-repeat",
				}}
				onClick={onClick}
			>
				<div
					className="rounded-full mb-2 flex items-center justify-center"
					style={{
						opacity: isConfirmed ? 1 : 0,
						marginTop: "8px",
						width: "86%",
						aspectRatio: "1 / 1",
						position: "absolute",
						backdropFilter: "blur(12px)",
						WebkitBackdropFilter: "blur(12px)",
						backgroundColor: "rgba(10, 10, 10, 0.3)", // translucent amber tint
						transition: `all ${tTime}ms ease-in-out`,
					}}
					onClick={onClick}
				>
				</div>
				<div
					className="flex flex-col items-center justify-center gap-2 select-none text-center"
					style={{
						opacity: isConfirmed ? 1 : 0,
						transform: isConfirmed ? "scale(2.2)" : "scale(1.2)",
						transformOrigin: "center",
						transition: `all ${tTime}ms ease-in-out`,
					}}
				>
					<div
						className="loader2"
						style={{filter: "invert(1) brightness(1.2)"}}
					/>
					<h2 className="m-0 leading-none text-white tracking-wide">LOADING...</h2>
				</div>
			</div>


			<span className="text-white"
				  style={{
					  fontFamily: "'Nunito Sans', 'Quicksand', sans-serif",
					  fontSize: isSelected ? `${5}vh` : `${2}vh`,
					  transition: "all 200ms ease-in-out",
				  }}
			>
				{label ?? selectionType}
			</span>
		</div>
	);
}
