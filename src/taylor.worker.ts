// taylor.worker.ts
import {create, all, type MathNode, type EvalFunction} from "mathjs";

const math = create(all);

type BuildReq = {
    type: "build";
    expr: string;
    x0: number;
    n: number;
    left: number;
    right: number;
    count: number;
};

type BuildRes = {
    type: "result";
    coeffs: Float64Array;
    xs: Float64Array;
    yf: Float64Array;
    yt: Float64Array;
    latex: string;	// "y=..."
};

self.onmessage = (e: MessageEvent<BuildReq>) => {
    if (e.data.type !== "build") return;
    const {expr, x0, n, left, right, count} = e.data;

    try {
        // 1) parse & simplify once
        let node: MathNode = math.parse(expr);
        node = math.simplify(node) as MathNode;

        // 2) compile f(x)
        const fCompiled: EvalFunction = node.compile();

        // 3) pre-differentiate and compile D^k f(x)
        const derivs: EvalFunction[] = [];
        let dNode = node;
        for (let k = 1; k <= n; k++) {
            dNode = math.derivative(dNode, "x") as MathNode;
            derivs.push(dNode.compile());
        }

        // 4) coefficients a_k = f^(k)(x0) / k!
        const coeffs = new Float64Array(n + 1);
        coeffs[0] = toReal(fCompiled.evaluate({x: x0}));
        for (let k = 1; k <= n; k++) {
            const dkx0 = toReal(derivs[k - 1].evaluate({x: x0}));
            coeffs[k] = dkx0 / factorial(k);
        }

        // 5) sample X, f(X), Tn(X) using Horner
        const xs = new Float64Array(count);
        const yf = new Float64Array(count);
        const yt = new Float64Array(count);
        const step = (right - left) / (count - 1);

        for (let i = 0; i < count; i++) {
            const x = left + i * step;
            xs[i] = x;
            yf[i] = toReal(fCompiled.evaluate({x}));

            let acc = 0;						// Horner for sum a_k (x-x0)^k
            const dx = x - x0;
            for (let k = n; k >= 0; k--) {
                acc = acc * dx + coeffs[k];
            }
            yt[i] = acc;
        }

        const latex = buildLatex(Array.from(coeffs), x0);
        const res: BuildRes = {type: "result", coeffs, xs, yf, yt, latex};

        // transfer buffers for zero-copy
        (self as any).postMessage(res, [coeffs.buffer, xs.buffer, yf.buffer, yt.buffer]);
    } catch (err: any) {
        (self as any).postMessage({type: "error", message: String(err?.message ?? err)});
    }
};

function toReal(v: any): number {
    const t = math.typeOf(v);
    if (t === "number") return v as number;
    if (t === "BigNumber") return (v as any).toNumber();
    if (t === "Fraction") return (v as any).valueOf();
    if (t === "Complex") {
        const re = (v as any).re as number, im = (v as any).im as number;
        if (Math.abs(im) > 1e-12) throw new Error(`Complex value: ${re}+${im}i`);
        return re;
    }
    throw new Error(`Unsupported math.js type: ${t}`);
}

function factorial(k: number): number {
    let f = 1;
    for (let i = 2; i <= k; i++) f *= i;
    return f;
}

function buildLatex(a: number[], x0: number): string {
    const dx = `(x-${fmt(x0)})`;
    const terms: string[] = [];
    for (let k = 0; k < a.length; k++) {
        const ak = a[k];
        if (Math.abs(ak) < 1e-15) continue;
        const coef = coefStr(ak, terms.length === 0);
        const term = k === 0 ? `${coef}` : k === 1 ? `${coef}${dx}` : `${coef}${dx}^{${k}}`;
        terms.push(term);
    }
    return `y=${terms.length ? terms.join("") : "0"}`;
}

// in taylor.worker.ts
function fmt(v: number): string
{
    if (v === 0) return "0";
    const abs = Math.abs(v);
    // Use scientific form outside a sensible decimal window
    if (abs >= 1e6 || abs < 1e-6) {
        const s = v.toExponential(6); // e.g. "-1.234560e-7"
        const m = /(-?\d+(?:\.\d+)?)[eE]([+\-]?\d+)/.exec(s);
        if (m) {
            const mant = trimDec(m[1]);
            const exp = parseInt(m[2], 10);
            // Desmos-safe: mantissa \cdot 10^{exp}
            return `${mant}\\cdot10^{${exp}}`;
        }
    }
    // Otherwise plain fixed with trimmed zeros
    return trimDec(v.toFixed(6));
}

function trimDec(s: string): string
{
    // remove trailing zeros, and trailing dot if needed
    return s.includes(".") ? s.replace(/\.?0+$/, "") : s;
}


function coefStr(a: number, first: boolean): string {
    const s = fmt(Math.abs(a));
    return first ? (a < 0 ? "-" : "") + s : a < 0 ? `-${s}` : `+${s}`;
}
