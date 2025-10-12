import React, {useEffect, useMemo, useRef, useState} from "react";

type CommandResult = string[] | Promise<string[]>;
type Command = (args: string[], ctx: CommandContext) => CommandResult;

type CommandContext = {
	print: (lines: string | string[]) => void;
	setTheme: (t: "dark" | "light") => void;
	navigate?: (path: string) => void; // hook your router if you want
	fetchJson: (path: string) => Promise<any>;
};

const PROMPT = "guest@britoland:~$";

export default function Terminal({
									 theme = "dark",
									 onOpenPortfolio,
									 navigate,
								 }: {
	theme?: "dark" | "light";
	onOpenPortfolio?: () => void;
	navigate?: (path: string) => void;
}) {
	const [lines, setLines] = useState<string[]>([]);
	const [input, setInput] = useState("");
	const [history, setHistory] = useState<string[]>([]);
	const [histIndex, setHistIndex] = useState(-1);
	const [blink, setBlink] = useState(true);
	const [currentTheme, setCurrentTheme] = useState<"dark" | "light">(theme);
	const [tabBuffer, setTabBuffer] = useState<string | null>(null);

	const scrollRef = useRef<HTMLDivElement | null>(null);
	const inputRef = useRef<HTMLInputElement | null>(null);

	// blink caret
	useEffect(() => {
		const id = setInterval(() => setBlink(b => !b), 520);
		return () => clearInterval(id);
	}, []);

	// auto-scroll
	useEffect(() => {
		scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
	}, [lines]);

	// global '/' to focus
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "/") {
				e.preventDefault();
				inputRef.current?.focus();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);

	// helpers
	const print = (l: string | string[]) =>
		setLines(prev => [...prev, ...(Array.isArray(l) ? l : [l])]);

	const fetchJson = async (path: string) => {
		const r = await fetch(path);
		if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
		return r.json();
	};

	const ctx: CommandContext = useMemo(
		() => ({ print, setTheme: setCurrentTheme, navigate, fetchJson }),
		[navigate]
	);

	// command registry
	const commands = useMemo<Record<string, Command>>(() => {
		return {
			help: () => [
				"Available commands:",
				"  help                 Show this help",
				"  clear                Clear the screen",
				"  whoami               Show current user",
				"  echo <text>          Print text",
				"  date                 Current time",
				"  theme <dark|light>   Switch terminal theme",
				"  portfolio            Open portfolio (hooked to UI)",
				"  open <path>          Navigate to route (use proxy navigate)",
				"  ping                 Call /api/ping via proxy",
				"  sleep <ms>           Simulate async delay",
			],
			clear: () => {
				setLines([]);
				return [];
			},
			whoami: () => ["guest (citizen of Britoland)"],
			echo: (args) => [args.join(" ")],
			date: () => [new Date().toString()],
			theme: (args, { setTheme }) => {
				const t = args[0] as "dark" | "light";
				if (t !== "dark" && t !== "light") return ["Usage: theme dark|light"];
				setTheme(t);
				return [`Theme set to ${t}`];
			},
			portfolio: () => {
				onOpenPortfolio?.();
				return ["Opening portfolio…"];
			},
			open: (args, { navigate }) => {
				if (!args[0]) return ["Usage: open /route"];
				if (!navigate) return ["No router connected."];
				navigate(args[0]);
				return [`Navigating to ${args[0]}…`];
			},
			ping: async (_args, { fetchJson }) => {
				try {
					const data = await fetchJson("/api/ping");
					return ["pong", JSON.stringify(data)];
				} catch (e: any) {
					return [`ping error: ${e?.message ?? e}`];
				}
			},
			sleep: async (args) => {
				const ms = Number(args[0] ?? 500);
				await new Promise(r => setTimeout(r, isNaN(ms) ? 500 : ms));
				return [`Slept ${isNaN(ms) ? 500 : ms} ms`];
			},
		};
	}, [onOpenPortfolio]);

	const allCmds = useMemo(() => Object.keys(commands).sort(), [commands]);

	// submit handler
	const run = async (raw: string) => {
		const line = raw.trim();
		// print prompt + raw
		setLines(prev => [...prev, `${PROMPT} ${raw}`]);
		if (!line) return;

		const [cmd, ...args] = tokenize(line);
		const fn = commands[cmd];

		setHistory(h => [...h, raw]);
		setHistIndex(-1);
		setTabBuffer(null);
		setInput("");

		if (!fn) {
			print([`britosh: command not found: ${cmd}`, `type "help" to list commands`]);
			return;
		}

		const out = fn(args, ctx);
		if (out instanceof Promise) {
			try {
				const res = await out;
				if (res.length) print(res);
			} catch (err: any) {
				print([`error: ${err?.message ?? String(err)}`]);
			}
		} else {
			if (out.length) print(out);
		}
	};

	// autocomplete on Tab
	const handleTab = () => {
		const cur = input.trim();
		const [head, ...rest] = tokenize(cur);
		if (!head) return;

		const matches = allCmds.filter(c => c.startsWith(head));
		if (matches.length === 1) {
			const completed = [matches[0], ...rest].join(" ") + " ";
			setInput(completed);
			setTabBuffer(null);
		} else if (matches.length > 1) {
			// double-tab behavior
			if (tabBuffer === head) {
				print(matches);
			} else {
				setTabBuffer(head);
			}
		}
	};

	// theme classes
	const themeCls =
		currentTheme === "dark"
			? {
				root: "bg-[#0b0d10] text-neutral-200",
				panel: "bg-[#0f1216] border-neutral-800",
				prompt: "text-emerald-400",
				dim: "text-neutral-500",
			}
			: {
				root: "bg-neutral-100 text-neutral-900",
				panel: "bg-white border-neutral-200",
				prompt: "text-emerald-600",
				dim: "text-neutral-500",
			};

	return (
		<div className={`w-screen h-screen ${themeCls.root}`}>
			<div className="w-full h-full px-4 sm:px-6 py-6 flex flex-col">

				<div
					ref={scrollRef}
					className={`flex-1 overflow-auto rounded-2xl border p-4 sm:p-6 shadow-inner ${themeCls.panel}`}
				>
					<div className="font-mono text-sm leading-6 whitespace-pre-wrap">
						{lines.length === 0 && (
							<div className={`${themeCls.dim} mb-3`}>
								Welcome to <span className="font-semibold">Britoland</span>. Type <i>help</i>.
								Press <kbd className="px-1 py-0.5 border rounded mx-1">/</kbd> to focus.
							</div>
						)}

						{lines.map((l, i) => (
							<div key={i}>{l}</div>
						))}

						{/* input row */}
						<div className="flex items-center">
							<span className={`mr-2 ${themeCls.prompt}`}>{PROMPT}</span>
							<input
								ref={inputRef}
								value={input}
								onChange={(e) => setInput(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										run(input);
									} else if (e.key === "Tab") {
										e.preventDefault();
										handleTab();
									} else if (e.key === "ArrowUp") {
										e.preventDefault();
										const next = histIndex === -1 ? history.length - 1 : Math.max(0, histIndex - 1);
										setHistIndex(next);
										setInput(history[next] ?? input);
									} else if (e.key === "ArrowDown") {
										e.preventDefault();
										if (histIndex === -1) return;
										const next = Math.min(history.length - 1, histIndex + 1);
										setHistIndex(next);
										setInput(history[next] ?? "");
									} else if (e.key === "c" && e.ctrlKey) {
										e.preventDefault();
										setLines(prev => [...prev, `${PROMPT} ${input}`, "^C"]);
										setInput("");
									}
								}}
								className="flex-1 bg-transparent outline-none border-0 focus:ring-0 font-mono text-sm"
								spellCheck={false}
								autoCapitalize="off"
								autoComplete="off"
								autoCorrect="off"
								autoFocus
								aria-label="Terminal input"
							/>
							<span className={`${themeCls.dim} ml-1`}>{blink ? "▍" : " "}</span>
						</div>
					</div>
				</div>

				<footer className={`mt-3 text-xs font-mono ${themeCls.dim}`}>
					Britoland © {new Date().getFullYear()} · try <i>portfolio</i>, <i>ping</i>, <i>theme dark</i>
				</footer>
			</div>
		</div>
	);
}

// naive tokenizer: respects quoted strings "like this"
function tokenize(s: string): string[] {
	const out: string[] = [];
	let cur = "";
	let quote: '"' | "'" | null = null;
	for (const ch of s) {
		if (quote) {
			if (ch === quote) {
				quote = null;
			} else {
				cur += ch;
			}
			continue;
		}
		if (ch === '"' || ch === "'") {
			quote = ch;
		} else if (/\s/.test(ch)) {
			if (cur) {
				out.push(cur);
				cur = "";
			}
		} else {
			cur += ch;
		}
	}
	if (cur) out.push(cur);
	return out;
}
