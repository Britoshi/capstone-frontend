import { useEffect, useMemo, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

/** ===== Types that match your backend contracts ===== */
interface CreateAccountDto {
	ownerName: string
	email: string
	currency: string
}

interface AccountView {
	id: string
	accountNumber: string
	currency: string
	balance: number
}

interface CreateTransferDto {
	fromAccountId: string
	toAccountId: string
	amount: number
	currency: string
}

interface TransferView {
	id: string
	fromAccountId: string
	toAccountId: string
	amount: number
	currency: string
	status: string
	createdAt: string
}

/** ===== API base (use Vite proxy) ===== */
const API_BASE = '/api'

/** Simple UUIDv4 generator for idempotency keys (browser-safe) */
function uuidv4(): string {
	if (typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID()
	}
	const bytes = new Uint8Array(16)
	crypto.getRandomValues(bytes)
	bytes[6] = (bytes[6] & 0x0f) | 0x40
	bytes[8] = (bytes[8] & 0x3f) | 0x80
	const toHex = (n: number) => n.toString(16).padStart(2, '0')
	const b = Array.from(bytes, toHex).join('')
	return `${b.slice(0,8)}-${b.slice(8,12)}-${b.slice(12,16)}-${b.slice(16,20)}-${b.slice(20)}`
}


/** Unified fetch helper (JSON, throws on !ok) */
async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
	const res = await fetch(`${API_BASE}${path}`, {
		...init,
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			...(init?.headers || {})
		}
	})
	const txt = await res.text()
	if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}\n${txt}`)
	return txt ? JSON.parse(txt) as T : (undefined as unknown as T)
}

/** ===== App ===== */
export default function App() {
	// Accounts
	const [accounts, setAccounts] = useState<AccountView[]>([])
	const [loadingAccounts, setLoadingAccounts] = useState(false)
	const [accountsError, setAccountsError] = useState<string | null>(null)

	// Create account form
	const [ownerName, setOwnerName] = useState('')
	const [email, setEmail] = useState('')
	const [currencyA, setCurrencyA] = useState('USD')
	const [creatingAccount, setCreatingAccount] = useState(false)
	const canCreateAccount = useMemo(() =>
			ownerName.trim().length > 0 && /\S+@\S+\.\S+/.test(email) && !!currencyA,
		[ownerName, email, currencyA]
	)

	// Transfer form
	const [fromId, setFromId] = useState('')
	const [toId, setToId] = useState('')
	const [amount, setAmount] = useState<number>(0)
	const [currencyT, setCurrencyT] = useState('USD')
	const [creatingTransfer, setCreatingTransfer] = useState(false)
	const [lastTransfer, setLastTransfer] = useState<TransferView | null>(null)
	const [transferError, setTransferError] = useState<string | null>(null)

	const canTransfer = useMemo(() =>
			fromId && toId && fromId !== toId && amount > 0 && !!currencyT,
		[fromId, toId, amount, currencyT]
	)

	/** Load accounts once on mount */
	useEffect(() => {
		void refreshAccounts()
	}, [])

	async function refreshAccounts() {
		setLoadingAccounts(true)
		setAccountsError(null)
		try {
			const data = await apiFetch<AccountView[]>('/Accounts')
			setAccounts(Array.isArray(data) ? data : [])
		} catch (err) {
			console.error(err)
			setAccountsError(err instanceof Error ? err.message : String(err))
		} finally {
			setLoadingAccounts(false)
		}
	}

	async function handleCreateAccount() {
		if (!canCreateAccount) return
		setCreatingAccount(true)
		try {
			const dto: CreateAccountDto = {
				ownerName: ownerName.trim(),
				email: email.trim(),
				currency: currencyA
			}
			await apiFetch<AccountView>('/Accounts', {
				method: 'POST',
				body: JSON.stringify(dto)
			})
			setOwnerName('')
			setEmail('')
			await refreshAccounts()
		} catch (err) {
			alert(`Create account failed:\n${err instanceof Error ? err.message : String(err)}`)
		} finally {
			setCreatingAccount(false)
		}
	}

	async function handleCreateTransfer() {
		if (!canTransfer) return
		setCreatingTransfer(true)
		setTransferError(null)
		try {
			const dto: CreateTransferDto = {
				fromAccountId: fromId,
				toAccountId: toId,
				amount,
				currency: currencyT
			}
			const res = await apiFetch<TransferView>('/Transfers', {
				method: 'POST',
				body: JSON.stringify(dto),
				// Idempotency for retries:
				headers: { 'Idempotency-Key': uuidv4() }
			})
			setLastTransfer(res)
			await refreshAccounts()
		} catch (err) {
			console.error(err)
			setTransferError(err instanceof Error ? err.message : String(err))
		} finally {
			setCreatingTransfer(false)
		}
	}

	return (
		<>
			<div>
				<a href="https://vite.dev" target="_blank" rel="noreferrer">
					<img src={viteLogo} className="logo" alt="Vite logo" />
				</a>
				<a href="https://react.dev" target="_blank" rel="noreferrer">
					<img src={reactLogo} className="logo react" alt="React logo" />
				</a>
			</div>

			<h1>Banking Emulator — Frontend Probe</h1>

			{/* Create Account */}
			<div className="card" style={{ maxWidth: 760, width: '100%' }}>
				<h2>Create Account</h2>
				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
					<label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
						<span>Owner Name</span>
						<input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
					</label>
					<label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
						<span>Email</span>
						<input value={email} onChange={(e) => setEmail(e.target.value)} />
					</label>
					<label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
						<span>Currency</span>
						<select value={currencyA} onChange={(e) => setCurrencyA(e.target.value)}>
							<option value="USD">USD</option>
							<option value="EUR">EUR</option>
							<option value="JPY">JPY</option>
						</select>
					</label>
				</div>
				<div style={{ marginTop: 12 }}>
					<button onClick={handleCreateAccount} disabled={!canCreateAccount || creatingAccount}>
						{creatingAccount ? 'Creating…' : 'Create Account'}
					</button>
				</div>
			</div>

			{/* Accounts List */}
			<div className="card" style={{ maxWidth: 900, width: '100%' }}>
				<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
					<h2 style={{ margin: 0 }}>Accounts</h2>
					<button onClick={refreshAccounts} disabled={loadingAccounts}>Refresh</button>
				</div>

				{accountsError && (
					<div style={{ color: 'red', whiteSpace: 'pre-wrap', marginTop: 8 }}>
						{accountsError}
					</div>
				)}

				{loadingAccounts ? (
					<p>Loading accounts…</p>
				) : accounts.length === 0 ? (
					<p>No accounts yet. Create a couple above.</p>
				) : (
					<div style={{ overflowX: 'auto' }}>
						<table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
							<thead>
							<tr>
								<th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>ID</th>
								<th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Account #</th>
								<th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Currency</th>
								<th style={{ textAlign: 'right', borderBottom: '1px solid #ddd', padding: 8 }}>Balance</th>
							</tr>
							</thead>
							<tbody>
							{accounts.map(a => (
								<tr key={a.id}>
									<td style={{ padding: 8 }}>{a.id}</td>
									<td style={{ padding: 8 }}>{a.accountNumber}</td>
									<td style={{ padding: 8 }}>{a.currency}</td>
									<td style={{ padding: 8, textAlign: 'right' }}>{a.balance.toFixed(2)}</td>
								</tr>
							))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* Transfer */}
			<div className="card" style={{ maxWidth: 760, width: '100%' }}>
				<h2>Transfer</h2>
				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
					<label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
						<span>From Account</span>
						<select value={fromId} onChange={(e) => setFromId(e.target.value)}>
							<option value="">Select…</option>
							{accounts.map(a => (
								<option key={a.id} value={a.id}>
									{a.accountNumber} — {a.currency} — Bal {a.balance.toFixed(2)}
								</option>
							))}
						</select>
					</label>
					<label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
						<span>To Account</span>
						<select value={toId} onChange={(e) => setToId(e.target.value)}>
							<option value="">Select…</option>
							{accounts.map(a => (
								<option key={a.id} value={a.id}>
									{a.accountNumber} — {a.currency} — Bal {a.balance.toFixed(2)}
								</option>
							))}
						</select>
					</label>
					<label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
						<span>Amount</span>
						<input
							type="number"
							min={0}
							step="0.01"
							value={Number.isFinite(amount) ? amount : 0}
							onChange={(e) => setAmount(parseFloat(e.target.value))}
						/>
					</label>
					<label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
						<span>Currency</span>
						<select value={currencyT} onChange={(e) => setCurrencyT(e.target.value)}>
							<option value="USD">USD</option>
							<option value="EUR">EUR</option>
							<option value="JPY">JPY</option>
						</select>
					</label>
				</div>

				<div style={{ marginTop: 12 }}>
					<button onClick={handleCreateTransfer} disabled={!canTransfer || creatingTransfer}>
						{creatingTransfer ? 'Transferring…' : 'Create Transfer'}
					</button>
				</div>

				{transferError && (
					<div style={{ color: 'red', whiteSpace: 'pre-wrap', marginTop: 8 }}>
						{transferError}
					</div>
				)}

				{lastTransfer && (
					<div style={{ marginTop: 12, textAlign: 'left' }}>
						<strong>Last Transfer</strong>
						<pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(lastTransfer, null, 2)}</pre>
					</div>
				)}
			</div>
		</>
	)
}
