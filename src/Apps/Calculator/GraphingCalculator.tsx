import { useEffect, useRef, useState } from "react";
import { parse } from "mathjs";
import { useTaylorWorker } from "../../UseTaylorWorker";

type Calc = any;

export default function GraphingCalculator()
{
    const containerRef = useRef<HTMLDivElement | null>(null);
    const calcRef = useRef<Calc | null>(null);

    const [expr, setExpr] = useState("exp(x)*cos(x)");
    const [x0, setX0] = useState(0.5);
    const [n, setN] = useState(5);
    const [domain, setDomain] = useState<[number, number]>([-2, 2]);
    const count = 600;

    const { data, error } = useTaylorWorker(expr, x0, n, domain[0], domain[1], count, 220);

    useEffect(() =>
    {
        const ensureScript = () => new Promise<void>((resolve, reject) =>
        {
            if ((window as any).Desmos) return resolve();
            const s = document.createElement("script");
            s.src = "https://www.desmos.com/api/v1.11/calculator.js?apiKey=2cb8d277bb2644ceaa005b10795630b5";
            s.async = true;
            s.onload = () => resolve();
            s.onerror = reject;
            document.head.appendChild(s);
        });
        let dead = false;
        ensureScript().then(() =>
        {
            if (dead || !containerRef.current) return;
            const Desmos = (window as any).Desmos;
            const calc = Desmos.GraphingCalculator(containerRef.current, {
                expressions: true,
                keypad: true,
                autosize: true
            });
            calcRef.current = calc;
            calc.setMathBounds({ left: domain[0], right: domain[1], bottom: -3, top: 3 });
            calc.setExpressions([
                { id: "orig", latex: "" },
                { id: "poly", latex: "" },
                { id: "tblF", type: "table", columns: [{ latex: "x_1", values: [] }, { latex: "y_1", values: [] }] },
                { id: "tblT", type: "table", columns: [{ latex: "x_2", values: [] }, { latex: "y_2", values: [] }] }
            ]);
        });
        return () => { dead = true; if (calcRef.current) { calcRef.current.destroy(); calcRef.current = null; } };
    }, [domain]);

    useEffect(() =>
    {
        if (!calcRef.current || !data) return;

        // pretty LaTeX for the original function (fallback to raw on parse errors)
        let origLatex = expr;
        try { origLatex = parse(expr).toTex(); } catch {}

        // Desmos expects only the RHS; worker returns "y=...": strip it
        const polyLatexRhs = data.latex.replace(/^y=/, "");

        calcRef.current.setExpressions([
            { id: "orig", latex: origLatex, color: "#2d70b3" }, // y = f(x)
            { id: "poly", latex: polyLatexRhs, color: "#c74440" } // y = T_n(x)
        ]);
    }, [data, expr]);


    return (
        <div style={{ width: "100%", height: "100%", color:"black" }}>
            <div style={{ padding: 8 }}>
                <label>f(x):</label>
                <input
                    value={expr}
                    onChange={(e) => setExpr(e.target.value)}
                    style={{ width: "100%" }}
                />
                <label style={{ marginLeft: 8 }}>x₀:</label>
                <input type="number" value={x0} step={0.1} onChange={(e) => setX0(Number(e.target.value))} />
                <label style={{ marginLeft: 8 }}>n:</label>
                <input type="number" value={n} min={0} max={20} onChange={(e) => setN(Number(e.target.value))} />
                <label style={{ marginLeft: 8 }}>domain:</label>
                <input type="number" value={domain[0]} step={0.1} onChange={(e) => setDomain([Number(e.target.value), domain[1]])} />
                <input type="number" value={domain[1]} step={0.1} onChange={(e) => setDomain([domain[0], Number(e.target.value)])} />
                {error && <div style={{ color: "crimson", marginTop: 8 }}>Error: {error}</div>}
            </div>
            <div ref={containerRef} style={{ width: "100%", height: "70vh" }} />
        </div>
    );
}
