import { useState, useEffect, useRef } from 'react'
import { CheckCircle2, Flame, ShieldAlert } from 'lucide-react'
import MotionGraphicPlayer from '../../../components/motion/MotionGraphicPlayer'

export default function PaymentLedgerMotionGraphic() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState<number>(0.5) // default to 0.5x slow walkthrough
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [strategyMode, setStrategyMode] = useState<'idempotent_ledger' | 'double_charge_crash' | 'ledger_imbalance'>('idempotent_ledger')

  const durationSec = 12.0
  const animFrameRef = useRef<number | null>(null)
  const lastTimestampRef = useRef<number | null>(null)

  // Animation Loop synced to requestAnimationFrame and speed
  useEffect(() => {
    if (!isPlaying) {
      lastTimestampRef.current = null
      return
    }

    const tick = (now: number) => {
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = now
      }
      const deltaSec = (now - lastTimestampRef.current) / 1000
      lastTimestampRef.current = now

      setCurrentTime((prev) => {
        const next = prev + deltaSec * speed
        if (next >= durationSec) {
          setIsPlaying(false)
          return durationSec
        }
        return next
      })

      animFrameRef.current = requestAnimationFrame(tick)
    }

    animFrameRef.current = requestAnimationFrame(tick)
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [isPlaying, speed])

  const handlePlayPause = () => {
    if (currentTime >= durationSec) {
      setCurrentTime(0)
      setIsPlaying(true)
    } else {
      setIsPlaying((p) => !p)
    }
  }

  const handleReplay = () => {
    setCurrentTime(0)
    setIsPlaying(true)
  }

  const handleSeek = (t: number) => {
    setCurrentTime(t)
  }

  // Calculate narrative, states & metrics based on time and mode
  let subtitle = ''
  let metrics: { label: string; value: string; variant?: 'default' | 'success' | 'warning' | 'danger' }[] = []
  let bankChargeCount = 1
  let isDoubleCharged = false
  let isImbalanced = false
  let idempotencyClaimed = false

  if (currentTime < 3.0) {
    idempotencyClaimed = true
    subtitle = '0.0s - 3.0s: Ingress. Client sends $100 charge with Idempotency-Key "idemp_982734". Gateway acquires atomic Redis mutex lock (SET NX EX 120).'
    metrics = [
      { label: 'Operation', value: 'POST /v1/charges', variant: 'default' },
      { label: 'Idempotency Key', value: 'idemp_982734 (UUID)', variant: 'default' },
      { label: 'Redis Claim', value: 'SET NX (Pending Lock)', variant: 'success' },
      { label: 'Ledger Invariant', value: 'Sum(Debit) == Sum(Credit)', variant: 'success' },
    ]
  } else if (currentTime < 6.0) {
    idempotencyClaimed = true
    if (strategyMode === 'double_charge_crash') {
      isDoubleCharged = true
      bankChargeCount = 2
      subtitle = '3.0s - 6.0s: FATAL DOUBLE-CHARGE! Missing idempotency check. User double-click or network retry sends 2nd charge to bank. Customer billed $200!'
      metrics = [
        { label: 'Duplicate Trigger', value: 'Network Retry / 2nd Click', variant: 'danger' },
        { label: 'Bank Ingress', value: '2 Distinct Charges Executed', variant: 'danger' },
        { label: 'Customer Impact', value: 'OVERCHARGED $200.00', variant: 'danger' },
        { label: 'Compliance Risk', value: 'Chargeback & FinReg Fines', variant: 'danger' },
      ]
    } else if (strategyMode === 'ledger_imbalance') {
      isImbalanced = true
      subtitle = '3.0s - 6.0s: SINGLE-ENTRY DRIFT! Bank executes debit, but server crashes before credit. Money vanished into thin air! Audit failed!'
      metrics = [
        { label: 'Customer Balance', value: 'Debited -$100.00', variant: 'warning' },
        { label: 'Merchant Balance', value: '$0.00 (Uncredited)', variant: 'danger' },
        { label: 'Ledger Discrepancy', value: '+$100.00 Missing', variant: 'danger' },
        { label: 'Audit Status', value: 'CRITICAL FINANCIAL LEAK', variant: 'danger' },
      ]
    } else {
      subtitle = '3.0s - 6.0s: Duplicate Request Blocked! Network retry arrives with "idemp_982734". Redis detects existing key. Duplicate blocked from bank!'
      metrics = [
        { label: 'Duplicate Request', value: 'Network Retry Intercepted', variant: 'warning' },
        { label: 'Redis Guard', value: 'Existing Key Found (Throttle)', variant: 'success' },
        { label: 'Bank Operations', value: 'Exactly 1 Bank Call Sent', variant: 'success' },
        { label: 'Cost Saved', value: 'Duplicate Interchange Avoided', variant: 'success' },
      ]
    }
  } else if (currentTime < 9.0) {
    if (strategyMode === 'double_charge_crash') {
      isDoubleCharged = true
      bankChargeCount = 2
      subtitle = '6.0s - 9.0s: REPUTATION DISASTER. Disputed transaction. Customer initiates fraud alert. Stripe / Visa dispute fee of $15 applied.'
      metrics = [
        { label: 'Dispute Rate', value: '100% Customer Dispute', variant: 'danger' },
        { label: 'Penalty Fee', value: '$15 Dispute Penalty', variant: 'danger' },
        { label: 'Ledger State', value: 'Corrupted Balance Sheet', variant: 'danger' },
        { label: 'Root Cause', value: 'Missing Idempotency-Key Gate', variant: 'danger' },
      ]
    } else if (strategyMode === 'ledger_imbalance') {
      isImbalanced = true
      subtitle = '6.0s - 9.0s: FAILED RECONCILIATION. Midnight EOD batch reconciliation detects un-balanced accounts. Regulators demand emergency audit.'
      metrics = [
        { label: 'Daily EOD Batch', value: 'FAILED (Unbalanced Entries)', variant: 'danger' },
        { label: 'Ledger Equation', value: 'Debits != Credits', variant: 'danger' },
        { label: 'Remediation', value: 'Rollback & Two-Phase Commit', variant: 'warning' },
        { label: 'System Action', value: 'Financial Services Suspended', variant: 'danger' },
      ]
    } else {
      subtitle = '6.0s - 9.0s: Double-Entry Ledger. ACID transaction commits balanced debit/credit lines. Sum of debits ($100) exactly matches sum of credits ($100).'
      metrics = [
        { label: 'Bank Authorization', value: 'AUTH_9918 Approved', variant: 'success' },
        { label: 'Debit Account', value: 'Customer Card: -$100.00', variant: 'default' },
        { label: 'Credit Account', value: 'Merchant Acct: +$97.00', variant: 'success' },
        { label: 'Platform Fee', value: 'Revenue: +$3.00', variant: 'success' },
      ]
    }
  } else {
    if (strategyMode === 'double_charge_crash') {
      isDoubleCharged = true
      bankChargeCount = 2
      subtitle = '9.0s - 12.0s: Verdict. Payments without idempotency keys violate RFC 7231 & financial safety standards. Idempotency is mandatory.'
      metrics = [
        { label: 'Verdict', value: 'CATASTROPHIC FAILURE', variant: 'danger' },
        { label: 'Fix', value: 'Enforce Redis Idempotency Lock', variant: 'warning' },
        { label: 'Stripe Standard', value: 'Mandatory Idempotency-Key', variant: 'default' },
        { label: 'Safety Guarantee', value: 'Exactly-Once Semantics', variant: 'default' },
      ]
    } else {
      subtitle = '9.0s - 12.0s: Exactly-Once Guarantee. Charge payload cached for 24h. All future retries return cached JSON in 1ms. Zero ledger discrepancies.'
      metrics = [
        { label: 'Payment Status', value: 'SUCCEEDED ($100.00)', variant: 'success' },
        { label: 'Cache TTL', value: '86,400s (24h Replay Safety)', variant: 'success' },
        { label: 'Ledger Balance', value: 'Net Delta = $0.00 (Balanced)', variant: 'success' },
        { label: 'Production Grade', value: 'ENTERPRISE STRICT ACID', variant: 'success' },
      ]
    }
  }

  return (
    <div className="w-full space-y-4">
      <MotionGraphicPlayer
        title="Idempotent Payment Processing & Double-Entry Ledger"
        subtitle="12-Second Slow Walkthrough · Stripe Architecture, Idempotency-Key RFC, Bank Rails & Balanced Ledger Invariance"
        durationSec={durationSec}
        currentTime={currentTime}
        isPlaying={isPlaying}
        speed={speed}
        onPlayPause={handlePlayPause}
        onReplay={handleReplay}
        onSeek={handleSeek}
        onSpeedChange={setSpeed}
        activeSubtitle={subtitle}
        metrics={metrics}
        toolbarExtra={
          <div className="flex items-center gap-1.5 rounded-lg border border-line bg-panel p-0.5 text-xs font-mono">
            <button
              type="button"
              onClick={() => { setStrategyMode('idempotent_ledger'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'idempotent_ledger'
                  ? 'bg-emerald-950/50 text-emerald-300 font-bold border border-emerald-600/60 shadow-xs'
                  : 'text-muted hover:text-chalk'
              }`}
            >
              <CheckCircle2 size={12} />
              <span>Idempotent + Ledger (Safe)</span>
            </button>
            <button
              type="button"
              onClick={() => { setStrategyMode('double_charge_crash'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'double_charge_crash'
                  ? 'bg-rose-950/50 text-rose-300 font-bold border border-rose-600/60 shadow-xs'
                  : 'text-muted hover:text-rose-300'
              }`}
            >
              <Flame size={12} />
              <span>Double-Charge (Crash)</span>
            </button>
            <button
              type="button"
              onClick={() => { setStrategyMode('ledger_imbalance'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'ledger_imbalance'
                  ? 'bg-amber-950/50 text-amber-300 font-bold border border-amber-600/60 shadow-xs'
                  : 'text-muted hover:text-amber-300'
              }`}
            >
              <ShieldAlert size={12} />
              <span>Ledger Imbalance (Leak)</span>
            </button>
          </div>
        }
      >
        {(canvasTheme) => {
          const isLight = canvasTheme === 'light'

          const textPrimary = isLight ? '#0f172a' : '#f8fafc'
          const textSecondary = isLight ? '#475569' : '#94a3b8'
          const cardBg = isLight ? '#ffffff' : '#111726'
          const cardBorder = isLight ? '#cbd5e1' : '#334155'
          const stripePurple = '#6366f1'
          const ledgerGreen = '#10b981'
          const dangerRed = '#ef4444'
          const bankBlue = '#0284c7'

          return (
            <div className="relative w-full aspect-[16/10] max-w-[860px] mx-auto py-2">
              <svg viewBox="0 0 880 500" className="w-full h-full transition-all duration-300">
                <defs>
                  <filter id="pay-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="5" floodOpacity={isLight ? '0.1' : '0.4'} floodColor="#000" />
                  </filter>
                </defs>

                {/* ==================== INGRESS & IDEMPOTENCY KEY (Left) ==================== */}
                <g transform="translate(25, 120)" filter="url(#pay-shadow)">
                  <rect x="0" y="0" width="165" height="260" rx="14" fill={cardBg} stroke={stripePurple} strokeWidth="3" />
                  <text x="82" y="28" textAnchor="middle" fill={textPrimary} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                    Checkout Ingress
                  </text>
                  <text x="82" y="44" textAnchor="middle" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    POST /v1/charges
                  </text>

                  {/* Idempotency Key Header Card */}
                  <g transform="translate(12, 58)">
                    <rect x="0" y="0" width="140" height="60" rx="6" fill={isLight ? '#eef2ff' : '#1e1b4b'} stroke={stripePurple} strokeWidth="1" />
                    <text x="10" y="18" fill={stripePurple} fontSize="9" fontWeight="bold" fontFamily="monospace">
                      Idempotency-Key:
                    </text>
                    <text x="10" y="34" fill={textPrimary} fontSize="9" fontFamily="monospace">
                      idemp_982734
                    </text>
                    <text x="10" y="48" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                      Client-Generated UUID
                    </text>
                  </g>

                  {/* Network Retry Counter */}
                  <g transform="translate(12, 130)">
                    <rect
                      x="0"
                      y="0"
                      width="140"
                      height="65"
                      rx="6"
                      fill={isDoubleCharged ? (isLight ? '#fee2e2' : '#450a0a') : (isLight ? '#f8fafc' : '#1e293b')}
                      stroke={isDoubleCharged ? dangerRed : cardBorder}
                      strokeWidth="1.5"
                    />
                    <text x="70" y="18" textAnchor="middle" fill={isDoubleCharged ? dangerRed : textPrimary} fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                      {isDoubleCharged ? 'DOUBLE CHARGE!' : 'NETWORK RETRY'}
                    </text>
                    <text x="70" y="36" textAnchor="middle" fill={isDoubleCharged ? dangerRed : ledgerGreen} fontSize="10" fontWeight="bold" fontFamily="monospace">
                      {isDoubleCharged ? '2x $100 Deducted' : 'Duplicate Blocked'}
                    </text>
                    <text x="70" y="52" textAnchor="middle" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                      {isDoubleCharged ? 'Customer overbilled' : 'Replay Safe'}
                    </text>
                  </g>

                  <rect x="12" y="206" width="140" height="40" rx="6" fill={isLight ? '#ecfdf5' : '#064e3b'} />
                  <text x="70" y="224" textAnchor="middle" fill={ledgerGreen} fontSize="9" fontWeight="bold" fontFamily="monospace">
                    Exactly-Once RPC
                  </text>
                  <text x="70" y="238" textAnchor="middle" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                    Zero Duplicate Risk
                  </text>
                </g>

                {/* ==================== IDEMPOTENCY GATE & REDIS MUTEX (Top-Center) ==================== */}
                <g transform="translate(230, 40)" filter="url(#pay-shadow)">
                  <rect x="0" y="0" width="370" height="150" rx="14" fill={cardBg} stroke={stripePurple} strokeWidth="3" />
                  <text x="185" y="26" textAnchor="middle" fill={textPrimary} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                    Idempotency Gate & Redis State Store
                  </text>
                  <text x="185" y="42" textAnchor="middle" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    Atomic State Machine: PENDING → COMPLETED
                  </text>

                  {/* Mutex State Representation */}
                  <g transform="translate(20, 56)">
                    <rect
                      x="0"
                      y="0"
                      width="330"
                      height="75"
                      rx="8"
                      fill={isLight ? '#f8fafc' : '#1e293b'}
                      stroke={idempotencyClaimed ? stripePurple : cardBorder}
                      strokeWidth="1.5"
                    />
                    <text x="15" y="22" fill={stripePurple} fontSize="10" fontWeight="bold" fontFamily="monospace">
                      SET idempotency:idemp_982734 PENDING NX EX 120
                    </text>
                    <text x="15" y="40" fill={textPrimary} fontSize="9" fontFamily="monospace">
                      Status: {currentTime < 9 ? 'IN_PROGRESS (Lock Acquired)' : 'COMPLETED (Result Cached)'}
                    </text>
                    <text x="15" y="58" fill={ledgerGreen} fontSize="8" fontWeight="bold" fontFamily="monospace">
                      {currentTime < 9 ? 'Lease TTL: 114s remaining' : 'Cached Response: HTTP 200 { txn_id: "tx_88192" }'}
                    </text>
                  </g>
                </g>

                {/* ==================== DOUBLE-ENTRY LEDGER TABLE (Bottom-Center) ==================== */}
                <g transform="translate(230, 220)" filter="url(#pay-shadow)">
                  <rect
                    x="0"
                    y="0"
                    width="370"
                    height="200"
                    rx="14"
                    fill={cardBg}
                    stroke={isImbalanced ? dangerRed : ledgerGreen}
                    strokeWidth={isImbalanced ? '3' : '2'}
                  />
                  <text x="185" y="26" textAnchor="middle" fill={textPrimary} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                    Strict Double-Entry Ledger (ACID)
                  </text>
                  <text x="185" y="42" textAnchor="middle" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    Invariant: Σ(Debits) == Σ(Credits)
                  </text>

                  {/* Balanced Ledger Rows */}
                  <g transform="translate(20, 56)">
                    {/* Row 1: Customer Debit */}
                    <rect x="0" y="0" width="330" height="26" rx="4" fill={isLight ? '#f1f5f9' : '#1e293b'} />
                    <text x="10" y="17" fill={textPrimary} fontSize="9" fontFamily="monospace">
                      DEBIT: Customer Card
                    </text>
                    <text x="320" y="17" textAnchor="end" fill={dangerRed} fontSize="9" fontWeight="bold" fontFamily="monospace">
                      -$100.00
                    </text>

                    {/* Row 2: Merchant Credit */}
                    <rect x="0" y="30" width="330" height="26" rx="4" fill={isLight ? '#f1f5f9' : '#1e293b'} />
                    <text x="10" y="47" fill={textPrimary} fontSize="9" fontFamily="monospace">
                      CREDIT: Merchant Account
                    </text>
                    <text x="320" y="47" textAnchor="end" fill={isImbalanced ? dangerRed : ledgerGreen} fontSize="9" fontWeight="bold" fontFamily="monospace">
                      {isImbalanced ? '$0.00 (MISSING)' : '+$97.00'}
                    </text>

                    {/* Row 3: Platform Fee */}
                    <rect x="0" y="60" width="330" height="26" rx="4" fill={isLight ? '#f1f5f9' : '#1e293b'} />
                    <text x="10" y="77" fill={textPrimary} fontSize="9" fontFamily="monospace">
                      CREDIT: Platform Fee (Revenue)
                    </text>
                    <text x="320" y="77" textAnchor="end" fill={ledgerGreen} fontSize="9" fontWeight="bold" fontFamily="monospace">
                      +$3.00
                    </text>
                  </g>

                  {/* Equation Summary Plaque */}
                  <g transform="translate(20, 155)">
                    <rect
                      x="0"
                      y="0"
                      width="330"
                      height="32"
                      rx="6"
                      fill={isImbalanced ? (isLight ? '#fee2e2' : '#450a0a') : (isLight ? '#ecfdf5' : '#064e3b')}
                      stroke={isImbalanced ? dangerRed : ledgerGreen}
                      strokeWidth="1"
                    />
                    <text x="165" y="20" textAnchor="middle" fill={isImbalanced ? dangerRed : ledgerGreen} fontSize="10" fontWeight="bold" fontFamily="monospace">
                      {isImbalanced ? 'ERROR: Net Delta = -$97.00 (LEAK)' : 'BALANCE CHECK: Net Delta = $0.00 ✓'}
                    </text>
                  </g>
                </g>

                {/* ==================== BANK RAILS & CARD NETWORK (Right) ==================== */}
                <g transform="translate(650, 100)" filter="url(#pay-shadow)">
                  <rect
                    x="0"
                    y="0"
                    width="200"
                    height="320"
                    rx="14"
                    fill={cardBg}
                    stroke={isDoubleCharged ? dangerRed : bankBlue}
                    strokeWidth="3"
                  />
                  <text x="100" y="28" textAnchor="middle" fill={textPrimary} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                    Core Banking Rails
                  </text>
                  <text x="100" y="44" textAnchor="middle" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    Visa / Mastercard Network
                  </text>

                  {/* Bank Execution Status */}
                  <g transform="translate(15, 60)">
                    <rect
                      x="0"
                      y="0"
                      width="170"
                      height="75"
                      rx="8"
                      fill={isDoubleCharged ? (isLight ? '#fee2e2' : '#450a0a') : (isLight ? '#f0f9ff' : '#0c4a6e')}
                      stroke={isDoubleCharged ? dangerRed : bankBlue}
                      strokeWidth="1.5"
                    />
                    <text x="10" y="20" fill={isDoubleCharged ? dangerRed : bankBlue} fontSize="9" fontWeight="bold" fontFamily="monospace">
                      Charges Executed:
                    </text>
                    <text x="10" y="40" fill={isDoubleCharged ? dangerRed : bankBlue} fontSize="13" fontWeight="bold" fontFamily="monospace">
                      {bankChargeCount} Charge{bankChargeCount > 1 ? 's' : ''} ($100 each)
                    </text>
                    <text x="10" y="60" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                      {isDoubleCharged ? 'DUPLICATE INTERCHANGE' : 'Auth Code: AUTH_9918'}
                    </text>
                  </g>

                  {/* Fraud / Dispute Card */}
                  <g transform="translate(15, 150)">
                    <rect
                      x="0"
                      y="0"
                      width="170"
                      height="65"
                      rx="8"
                      fill={isDoubleCharged ? (isLight ? '#fee2e2' : '#450a0a') : (isLight ? '#f8fafc' : '#1e293b')}
                      stroke={isDoubleCharged ? dangerRed : cardBorder}
                      strokeWidth="1.5"
                    />
                    <text x="10" y="18" fill={isDoubleCharged ? dangerRed : textPrimary} fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                      Dispute & Fraud Risk
                    </text>
                    <text x="10" y="36" fill={isDoubleCharged ? dangerRed : ledgerGreen} fontSize="10" fontWeight="bold" fontFamily="monospace">
                      {isDoubleCharged ? 'CHARGEBACK OPENED' : 'Risk Score: 0.02 (Low)'}
                    </text>
                    <text x="10" y="52" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                      {isDoubleCharged ? '+$15 Visa Penalty Fee' : '3D Secure 2.0 Passed'}
                    </text>
                  </g>

                  <rect x="15" y="235" width="170" height="42" rx="6" fill={isLight ? '#f0fdf4' : '#052e16'} />
                  <text x="85" y="255" textAnchor="middle" fill={ledgerGreen} fontSize="9" fontWeight="bold" fontFamily="monospace">
                    SLA: P99 &lt; 300 ms
                  </text>
                  <text x="85" y="268" textAnchor="middle" fill={textSecondary} fontSize="7" fontFamily="sans-serif">
                    Zero Phantom Transactions
                  </text>
                </g>

                {/* OVERLAY WARNING: DOUBLE CHARGE */}
                {isDoubleCharged && (
                  <g transform="translate(230, 435)">
                    <rect x="0" y="0" width="420" height="52" rx="10" fill={isLight ? '#fef2f2' : '#450a0a'} stroke={dangerRed} strokeWidth="2.5" />
                    <text x="210" y="22" textAnchor="middle" fill={dangerRed} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                      🚨 FINANCIAL VIOLATION: Customer Charged Twice ($200)
                    </text>
                    <text x="210" y="38" textAnchor="middle" fill={isLight ? '#991b1b' : '#fca5a5'} fontSize="10" fontFamily="monospace">
                      Missing idempotency key allowed retry to execute second bank debit!
                    </text>
                  </g>
                )}

                {/* OVERLAY WARNING: LEDGER IMBALANCE */}
                {isImbalanced && (
                  <g transform="translate(230, 435)">
                    <rect x="0" y="0" width="420" height="52" rx="10" fill={isLight ? '#fffbeb' : '#451a03'} stroke={dangerRed} strokeWidth="2.5" />
                    <text x="210" y="22" textAnchor="middle" fill={dangerRed} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                      ⚠️ LEDGER IMBALANCE: Debits Do Not Equal Credits
                    </text>
                    <text x="210" y="38" textAnchor="middle" fill={isLight ? '#991b1b' : '#fca5a5'} fontSize="10" fontFamily="monospace">
                      Money deducted from customer without merchant credit. Audit failed!
                    </text>
                  </g>
                )}
              </svg>
            </div>
          )
        }}
      </MotionGraphicPlayer>
    </div>
  )
}