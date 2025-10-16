import type {CSSProperties} from "react";

export type BackdropProps = React.PropsWithChildren<{
	bg: string;
	dimming?: number;
	blur?: number;
	style: CSSProperties;
}>

export default function Backdrop({bg, style, dimming = 0.0, blur = 0.0, children}: BackdropProps)
{
	const blurAmount = Math.floor(12.0 * blur);
	return (
		<div
			style={{
				backgroundImage: `url(${bg})`,
				backgroundSize: "cover",
				backgroundPosition: "center",
				backgroundRepeat: "no-repeat",
				...style,
			}}
		>
			<div
				style={{
					position: "absolute",
					inset: 0,
					backdropFilter: blur > 0 ? `blur(${blurAmount}px)` : `none`,
					WebkitBackdropFilter:  blur > 0 ? `blur(${blurAmount}px)` : `none`,
					backgroundColor: `rgba(0,0,0,${dimming})`,
					pointerEvents: "none",
				}}
			/>
			{children}
		</div>)
}