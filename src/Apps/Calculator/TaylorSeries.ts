// taylor.ts
import { create, all, type MathNode } from "mathjs";
const math = create(all);

/** Builds the Taylor polynomial T_n(x) for exprStr about x0. */
export default function GetTaylor(
    exprStr: string,
    x0: number,
    n: number
): {
    eval: (x: number) => number;
    coeffs: number[];	// a_k = f^(k)(x0) / k!
    latex: string;		// e.g., y=1.23+0.5(x-0.5)-0.2(x-0.5)^{2}
} {
    // Parse once
    let node: MathNode = math.parse(exprStr);

    console.log(node)
    // a0..an
    const coeffs: number[] = [];

    // Helper: factorial as number
    const fact = (k: number) => {
        const v = math.factorial(k) as unknown as number | bigint;
        return typeof v === "bigint" ? Number(v) : (v as number);
    };

    // k = 0 term
    coeffs.push(numberEval(node, x0));

    // higher derivatives
    for (let k = 1; k <= n; k++) {
        node = math.derivative(node, "x") as MathNode;
        const dkAtX0 = numberEval(node, x0);
        coeffs.push(dkAtX0 / fact(k));
    }

    // evaluator for T_n(x)
    const evalPoly = (x: number) => {
        const dx = x - x0;
        let sum = 0;
        let p = 1; // (x - x0)^k rolling power
        for (let k = 0; k < coeffs.length; k++) {
            if (k > 0) p *= dx;
            sum += coeffs[k] * p;
        }
        return sum;
    };

    // produce a simple LaTeX string for Desmos (y=...)
    const latex = buildLatex(coeffs, x0);

    return { eval: evalPoly, coeffs, latex };
}

/** Evaluate a MathNode at a numeric x. */
function numberEval(node: MathNode, x: number): number
{
    const v = node.evaluate({ x: x });
    const t = math.typeOf(v);


    switch (t)
    {
        case "function":
            return v(x);
        default:
            return v
    }
}
/** Build a compact LaTeX string: y=a0 + a1(x-x0) + a2(x-x0)^{2} + ... */
function buildLatex(coeffs: number[], x0: number): string {
    const dx = `(x-${formatNum(x0)})`;
    const terms: string[] = [];
    for (let k = 0; k < coeffs.length; k++) {
        const a = coeffs[k];
        if (almostZero(a)) continue;

        const coef = formatCoef(a, terms.length === 0);
        let term = "";
        if (k === 0) {
            term = `${coef}`;
        } else if (k === 1) {
            term = `${coef}${dx}`;
        } else {
            term = `${coef}${dx}^{${k}}`;
        }
        terms.push(term);
    }
    const rhs = terms.length ? terms.join("") : "0";
    return `y=${rhs}`;
}

function formatNum(v: number): string {
    // reasonable compact formatting
    return Math.abs(v) < 1e-6 || Math.abs(v) >= 1e6 ? v.toExponential(6) : v.toFixed(6);
}

function formatCoef(a: number, first: boolean): string {
    const s = formatNum(Math.abs(a));
    if (first) return (a < 0 ? "-" : "") + s;
    return a < 0 ? `-${s}` : `+${s}`;
}

function almostZero(a: number, eps = 1e-15) { return Math.abs(a) < eps; }
