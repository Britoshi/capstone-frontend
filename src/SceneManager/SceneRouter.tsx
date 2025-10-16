// SceneRouter.tsx
import {useEffect, useRef, useState} from "react";
import type {Scene} from "./Scenes.ts";

export interface SceneRouterProps
{
	scene: Scene;					// current scene
	durationMs?: number;			// shared duration (default 300)
	ease?: string;					// shared easing (default "ease")
	render: (scene: Scene) => React.ReactNode;	// how to render a scene
}

export default function SceneRouter({scene, durationMs = 300, ease = "ease", render}: SceneRouterProps)
{
	const [prev, setPrev] = useState<Scene | null>(null);
	const [animKey, setAnimKey] = useState(0); // bump to retrigger CSS
	const prevSceneRef = useRef<Scene | null>(null);

	useEffect(() =>
	{
		if (scene !== prevSceneRef.current)
		{
			setPrev(prevSceneRef.current);	// hold previous to animate out
			prevSceneRef.current = scene;
			setAnimKey(k => k + 1);
			const t = setTimeout(() => setPrev(null), durationMs);
			return () => clearTimeout(t);
		}
	}, [scene, durationMs]);

	return (
		<div
			className="scene-stack"
			style={{
				position: "relative",
				width: "100vw",
				minHeight: "100vh",
				overflow: "hidden"
			}}
		>
			{/* Current (animates IN) */}
			<div
				key={`in-${animKey}`}
				className="scene-layer scene-in"
				style={{
					position: "absolute",
					inset: 0,
					transition: `opacity ${durationMs}ms ${ease}, transform ${durationMs}ms ${ease}`,
					opacity: 1,
					transform: "scale(1)"
				}}
			>
				{render(scene)}
			</div>

			{/* Previous (animates OUT) */}
			{prev && (
				<div
					key={`out-${animKey}`}
					className="scene-layer scene-out"
					style={{
						position: "absolute",
						inset: 0,
						transition: `opacity ${durationMs}ms ${ease}, transform ${durationMs}ms ${ease}`,
						opacity: 0,
						transform: "scale(0.98)",	// slight shrink on exit
						pointerEvents: "none"
					}}
				>
					{render(prev)}
				</div>
			)}
		</div>
	);
}
