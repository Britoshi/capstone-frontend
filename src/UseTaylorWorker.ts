// useTaylorWorker.ts
import { useEffect, useMemo, useRef, useState } from "react";

type Result = {
    coeffs: Float64Array;
    xs: Float64Array;
    yf: Float64Array;
    yt: Float64Array;
    latex: string;
};

export function useTaylorWorker(
    expr: string,
    x0: number,
    n: number,
    left: number,
    right: number,
    count: number,
    debounceMs = 220
) {
    const workerRef = useRef<Worker | null>(null);
    const [data, setData] = useState<Result | null>(null);
    const [error, setError] = useState<string | null>(null);

    // stable key for re-compute
    const key = useMemo(
        () => `${expr}::${x0}::${n}::${left}::${right}::${count}`,
        [expr, x0, n, left, right, count]
    );

    useEffect(() => {
        if (!workerRef.current) {
            workerRef.current = new Worker(new URL("./taylor.worker.ts", import.meta.url), { type: "module" });
        }
        const w = workerRef.current;

        let timer: number | null = null;
        const fire = () => w.postMessage({ type: "build", expr, x0, n, left, right, count });

        const onMessage = (e: MessageEvent<any>) => {
            if (e.data?.type === "result") {
                setData(e.data as Result);
                setError(null);
            } else if (e.data?.type === "error") {
                setError(e.data.message ?? "Worker error");
            }
        };
        w.addEventListener("message", onMessage);

        // debounce
        timer = window.setTimeout(fire, debounceMs);

        return () => {
            if (timer) window.clearTimeout(timer);
            w.removeEventListener("message", onMessage);
        };
    }, [key, debounceMs]);

    return { data, error };
}
