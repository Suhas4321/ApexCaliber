import { useState, useEffect, useRef } from 'react'
import {
  Database,
  Zap,
  Server,
  Layers,
  HardDrive,
  Lock,
  Unlock,
  AlertTriangle,
  RotateCcw,
  Flame,
  Clock,
  Key,
  ShieldCheck,
  Activity,
} from 'lucide-react'
import type { VisualizerProps } from './types'

type CacheViewMode = 'cache_aside' | 'stampede_mutex' | 'dbdiagram_schema'

interface UserRecord {
  id: number
  name: string
  email: string
  balance: number
  tier: string
}

const MOCK_DB: Record<number, UserRecord> = {
  101: { id: 101, name: 'Priya Sharma', email: 'priya@tech.in', balance: 24500, tier: 'Diamond' },
  102: { id: 102, name: 'Arjun Mehta', email: 'arjun@payments.co', balance: 12000, tier: 'Gold' },
  103: { id: 103, name: 'Ananya Rao', email: 'ananya@cloud.io', balance: 89000, tier: 'Enterprise' },
}

export default function CacheRelationalVisualizer({ step: _step, config: _config }: VisualizerProps) {
  const [viewMode, setViewMode] = useState<CacheViewMode>('cache_aside')

  // Cache state
  const [cache, setCache] = useState<Record<string, { data: UserRecord; ttl: number }>>({
    'user:101': { data: MOCK_DB[101], ttl: 180 },
  })
  const [activeKey, setActiveKey] = useState<number>(101)

  // Simulation telemetry
  const [appStatus, setAppStatus] = useState<string>('System Idle — Ready to handle requests')
  const [lastLatency, setLastLatency] = useState<number>(0)
  const [hitCount, setHitCount] = useState<number>(12)
  const [missCount, setMissCount] = useState<number>(3)
  const [dbQueriesCount, setDbQueriesCount] = useState<number>(3)
  const [activeStep, setActiveStep] = useState<'idle' | 'checking_cache' | 'cache_hit' | 'cache_miss' | 'querying_db' | 'writing_cache'>('idle')

  // Stampede state
  const [mutexEnabled, setMutexEnabled] = useState<boolean>(true)
  const [isSimulatingStampede, setIsSimulatingStampede] = useState<boolean>(false)
  const [stampedeSurgeRequests, setStampedeSurgeRequests] = useState<number>(0)
  const [dbLoadPercent, setDbLoadPercent] = useState<number>(5)
  const [stampedeLogs, setStampedeLogs] = useState<string[]>([])
  const [mutexLocked, setMutexLocked] = useState<boolean>(false)

  // TTL decay ticker
  const ttlRef = useRef<number | null>(null)
  useEffect(() => {
    ttlRef.current = window.setInterval(() => {
      setCache((prev) => {
        const next: Record<string, { data: UserRecord; ttl: number }> = {}
        for (const [k, v] of Object.entries(prev)) {
          if (v.ttl > 1) {
            next[k] = { ...v, ttl: v.ttl - 1 }
          }
        }
        return next
      })
    }, 1000)
    return () => {
      if (ttlRef.current) clearInterval(ttlRef.current)
    }
  }, [])

  // Execute Cache-Aside Read Flow
  const handleQueryUser = (userId: number) => {
    setActiveKey(userId)
    setActiveStep('checking_cache')
    setAppStatus(`[App] GET /api/v1/users/${userId} received. Checking Redis for 'user:${userId}'...`)

    const cacheKey = `user:${userId}`
    const cachedItem = cache[cacheKey]

    setTimeout(() => {
      if (cachedItem) {
        // Cache Hit
        setActiveStep('cache_hit')
        setLastLatency(1.2)
        setHitCount((h) => h + 1)
        setAppStatus(`★ 100% CACHE HIT: 'user:${userId}' found in Redis RAM! Returned in 1.2ms (Zero SQL Disk I/O).`)
        setTimeout(() => setActiveStep('idle'), 1600)
      } else {
        // Cache Miss -> SQL Query -> Write back to cache
        setActiveStep('cache_miss')
        setMissCount((m) => m + 1)
        setAppStatus(`⚡ CACHE MISS: Key 'user:${userId}' not in Redis. Falling back to PostgreSQL on Disk...`)

        setTimeout(() => {
          setActiveStep('querying_db')
          setDbQueriesCount((q) => q + 1)
          const record = MOCK_DB[userId] || { id: userId, name: `User ${userId}`, email: `user${userId}@domain.com`, balance: 1000, tier: 'Standard' }

          setTimeout(() => {
            setActiveStep('writing_cache')
            setCache((prev) => ({
              ...prev,
              [cacheKey]: { data: record, ttl: 240 },
            }))
            setLastLatency(54.6)
            setAppStatus(`✓ POSTGRES REPLIED (54.6ms). Written back to Redis with TTL=240s. Next request will be 1ms!`)
            setTimeout(() => setActiveStep('idle'), 1800)
          }, 700)
        }, 600)
      }
    }, 500)
  }

  // Flush / Invalidate Key
  const handleInvalidate = (userId: number) => {
    const key = `user:${userId}`
    setCache((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    setAppStatus(`🗑️ Cache Invalidation: DEL ${key} executed in Redis. Next read will trigger Cache-Aside reload!`)
  }

  // Run Stampede Simulation
  const handleSimulateStampede = () => {
    setIsSimulatingStampede(true)
    const key = `user:${activeKey}`

    // Ensure key is expired to trigger the stampede
    setCache((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })

    const requests = 50
    setStampedeSurgeRequests(requests)
    setStampedeLogs([])

    if (mutexEnabled) {
      // With Mutex: Request #1 acquires lock, rest wait and hit cache
      setMutexLocked(true)
      setDbLoadPercent(14)
      setStampedeLogs([
        `[T=0ms] ⚡ 50 simultaneous incoming requests for expired key '${key}'`,
        `[T=2ms] Req #1: Acquires Redis Mutex via 'SET mutex:${key} 1 NX EX 5' -> SUCCESS`,
        `[T=4ms] Req #2-#50: Failed to acquire lock (busy) -> Backing off / sleeping 50ms...`,
        `[T=38ms] Req #1: Finished PostgreSQL query for record -> Populates Redis key '${key}'`,
        `[T=42ms] Req #1: Released Mutex via DEL mutex:${key}`,
        `[T=55ms] Req #2-#50: Wake up, retry Redis -> 100% CACHE HIT! DB sheltered!`,
      ])

      setTimeout(() => {
        setCache((prev) => ({
          ...prev,
          [key]: { data: MOCK_DB[activeKey] || MOCK_DB[101], ttl: 300 },
        }))
        setMutexLocked(false)
        setDbLoadPercent(8)
        setIsSimulatingStampede(false)
        setHitCount((h) => h + 49)
        setDbQueriesCount((q) => q + 1)
      }, 1500)
    } else {
      // WITHOUT Mutex (Broken Demo / Feel The Pain!):
      setDbLoadPercent(98)
      setStampedeLogs([
        `[T=0ms] ⚠️ 50 simultaneous incoming requests for expired key '${key}'`,
        `[T=3ms] 💥 NO MUTEX GUARD! All 50 requests simultaneously see Cache Miss!`,
        `[T=8ms] 💥 Thundering Herd: All 50 threads execute 'SELECT * FROM users' at once!`,
        `[T=25ms] 🚨 PostgreSQL Connection Pool EXHAUSTED: active_connections = 50 / 50`,
        `[T=60ms] 🚨 DB Disk I/O 100% Saturation, CPU pegged at 98%, latency spikes to 890ms!`,
        `[T=90ms] ❌ 18 requests TIMED OUT with 'Error: 504 Gateway Timeout / DB Connection Pool Starvation'`,
      ])

      setTimeout(() => {
        setCache((prev) => ({
          ...prev,
          [key]: { data: MOCK_DB[activeKey] || MOCK_DB[101], ttl: 300 },
        }))
        setDbLoadPercent(25)
        setIsSimulatingStampede(false)
        setMissCount((m) => m + 50)
        setDbQueriesCount((q) => q + 50)
      }, 2000)
    }
  }

  const hitRate = hitCount + missCount > 0 ? Math.round((hitCount / (hitCount + missCount)) * 100) : 0

  return (
    <div className="flex h-full w-full flex-col gap-3 p-4 font-sans text-slate-200">
      {/* Top Header & Architecture Archetype Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2E3446] pb-3">
        <div className="flex items-center gap-2">
          <Database size={18} className="text-cyan" />
          <span className="font-plate text-sm font-bold tracking-wide text-chalk">
            Redis In-Memory Cache & Relational Engine
          </span>
          <span className="rounded-full bg-cyan/15 px-2 py-0.5 text-2xs font-mono text-cyan font-semibold">
            Citadel III Visualizer
          </span>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1 rounded-xl border border-[#2E3446] bg-[#0E1118] p-1 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('cache_aside')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-all ${
              viewMode === 'cache_aside' ? 'bg-cyan text-slate-950 font-bold shadow-sm' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <Zap size={13} /> 1. Cache-Aside Flow
          </button>
          <button
            type="button"
            onClick={() => setViewMode('stampede_mutex')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-all ${
              viewMode === 'stampede_mutex' ? 'bg-amber text-slate-950 font-bold shadow-sm' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <Lock size={13} /> 2. Stampede & Mutex Lock
          </button>
          <button
            type="button"
            onClick={() => setViewMode('dbdiagram_schema')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-all ${
              viewMode === 'dbdiagram_schema' ? 'bg-sky-500 text-white font-bold shadow-sm' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <Layers size={13} /> 3. dbdiagram.io ER Schema
          </button>
        </div>
      </div>

      {/* Real-Time Telemetry Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 rounded-xl border border-[#222838] bg-[#0E1118] p-2.5 text-xs font-mono">
        <div className="flex flex-col">
          <span className="text-2xs text-[#94A3B8]">Cache Hit Rate</span>
          <span className={`text-sm font-bold ${hitRate >= 80 ? 'text-emerald' : 'text-amber'}`}>
            {hitRate}% ({hitCount} hits / {missCount} misses)
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-2xs text-[#94A3B8]">Last Query Latency</span>
          <span className={`text-sm font-bold ${lastLatency <= 2 ? 'text-cyan' : 'text-amber'}`}>
            {lastLatency > 0 ? `${lastLatency}ms` : '—'} {lastLatency <= 2 && lastLatency > 0 ? '(⚡ RAM Hit)' : lastLatency > 0 ? '(Disk Read)' : ''}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-2xs text-[#94A3B8]">PostgreSQL Queries</span>
          <span className="text-sm font-bold text-slate-200">{dbQueriesCount} executions</span>
        </div>
        <div className="flex flex-col">
          <span className="text-2xs text-[#94A3B8]">DB Pool Load</span>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${dbLoadPercent > 70 ? 'text-crimson' : 'text-emerald'}`}>
              {dbLoadPercent}%
            </span>
            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${dbLoadPercent > 70 ? 'bg-crimson' : 'bg-emerald'}`}
                style={{ width: `${Math.min(100, dbLoadPercent)}%` }}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-2xs text-[#94A3B8]">Active Keys in RAM</span>
          <span className="text-sm font-bold text-cyan">{Object.keys(cache).length} stored</span>
        </div>
      </div>

      {/* Main Interactive Stage Area */}
      <div className="flex flex-1 flex-col gap-4 rounded-2xl border border-[#2E3446] bg-[#0A0D14] p-4 shadow-inner overflow-y-auto">
        {/* Status notification bar */}
        <div className="flex items-center justify-between rounded-xl border border-[#222838] bg-[#101420] px-4 py-2 text-xs font-mono">
          <span className="flex items-center gap-2">
            <Activity size={14} className="text-cyan animate-pulse" />
            <span className="text-slate-300">{appStatus}</span>
          </span>
          {activeStep !== 'idle' && (
            <span className="rounded-full bg-cyan/20 px-2.5 py-0.5 text-2xs font-bold uppercase text-cyan">
              {activeStep.replace(/_/g, ' ')}
            </span>
          )}
        </div>

        {/* VIEW 1: CACHE-ASIDE INTERACTIVE ARCHITECTURE */}
        {viewMode === 'cache_aside' && (
          <div className="flex flex-col gap-4 flex-1">
            {/* Interactive Control Deck */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#222838] bg-[#121624] p-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono text-2xs text-muted uppercase">Dispatch Test Request:</span>
                {[101, 102, 103].map((uid) => {
                  const isCached = Boolean(cache[`user:${uid}`])
                  return (
                    <button
                      key={uid}
                      type="button"
                      onClick={() => handleQueryUser(uid)}
                      className="flex items-center gap-1.5 rounded-lg border border-[#2E3446] bg-[#181D2E] px-3 py-1.5 font-mono text-xs font-semibold text-chalk hover:border-cyan hover:bg-[#1E253A] transition-all"
                    >
                      <span>GET /users/{uid}</span>
                      {isCached ? (
                        <span className="h-2 w-2 rounded-full bg-emerald" title="Cached in Redis" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-amber" title="Not in cache (will query DB)" />
                      )}
                    </button>
                  )
                })}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleInvalidate(activeKey)}
                  className="rounded-lg border border-line bg-panel-2 px-2.5 py-1 font-mono text-2xs text-muted hover:text-crimson hover:border-crimson/50 transition-colors"
                >
                  Expire Key 'user:{activeKey}'
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCache({ 'user:101': { data: MOCK_DB[101], ttl: 180 } })
                    setHitCount(0)
                    setMissCount(0)
                    setDbQueriesCount(0)
                    setAppStatus('Cache and counters reset to baseline.')
                  }}
                  className="rounded-lg border border-line bg-panel-2 p-1.5 text-muted hover:text-white"
                  title="Reset Simulator"
                >
                  <RotateCcw size={13} />
                </button>
              </div>
            </div>

            {/* Split Stage: App Server ➔ Redis RAM ➔ PostgreSQL Disk */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1 items-stretch">
              {/* NODE 1: Application Server */}
              <div className="flex flex-col rounded-2xl border border-[#222838] bg-[#101420] p-4">
                <div className="flex items-center justify-between border-b border-[#222838] pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Server size={16} className="text-sky-400" />
                    <span className="font-plate text-xs font-bold text-white">App Server (FastAPI)</span>
                  </div>
                  <span className="text-2xs font-mono text-muted">Controller</span>
                </div>
                <div className="flex-1 space-y-2 text-2xs font-mono text-muted">
                  <p className="text-slate-300">Strategy: Cache-Aside (Lazy Loading)</p>
                  <div className="rounded-lg bg-[#0A0D14] p-2.5 border border-[#1A1F2C] space-y-1 text-slate-400">
                    <div>1. val = redis.get(key)</div>
                    <div className={activeStep === 'cache_hit' ? 'text-emerald font-bold' : ''}>2. if val: return val (1ms)</div>
                    <div className={activeStep === 'querying_db' ? 'text-amber font-bold' : ''}>3. row = db.query(sql) (50ms)</div>
                    <div className={activeStep === 'writing_cache' ? 'text-cyan font-bold' : ''}>4. redis.setex(key, 300, row)</div>
                    <div>5. return row</div>
                  </div>
                  <div className="pt-2 text-center">
                    <span className="text-2xs text-[#64748B]">Active inspected key: </span>
                    <strong className="text-cyan font-mono font-bold">user:{activeKey}</strong>
                  </div>
                </div>
              </div>

              {/* NODE 2: Redis In-Memory Cache (RAM) */}
              <div className={`flex flex-col rounded-2xl border p-4 transition-all duration-300 ${
                activeStep === 'cache_hit'
                  ? 'border-emerald bg-emerald/[0.07] shadow-lg shadow-emerald/10'
                  : activeStep === 'writing_cache'
                  ? 'border-cyan bg-cyan/[0.07] shadow-lg shadow-cyan/10'
                  : 'border-[#222838] bg-[#101420]'
              }`}>
                <div className="flex items-center justify-between border-b border-[#222838] pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-amber" />
                    <span className="font-plate text-xs font-bold text-white">Redis Cache (RAM)</span>
                  </div>
                  <span className="text-2xs font-mono text-emerald font-semibold">100ns RAM Access</span>
                </div>

                <div className="flex-1 flex flex-col gap-2">
                  <span className="text-2xs font-mono text-faint uppercase">Stored Keys & TTL:</span>
                  {Object.keys(cache).length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-2xs font-mono text-faint italic p-4 border border-dashed border-[#222838] rounded-xl">
                      Cache empty. Next read will miss and query Postgres.
                    </div>
                  ) : (
                    Object.entries(cache).map(([k, item]) => (
                      <div
                        key={k}
                        className={`rounded-xl border p-2.5 font-mono text-xs transition-all ${
                          k === `user:${activeKey}`
                            ? 'border-cyan bg-cyan/10 text-white'
                            : 'border-[#222838] bg-[#141824] text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-cyan">{k}</span>
                          <span className="flex items-center gap-1 text-2xs text-amber font-semibold">
                            <Clock size={11} /> {item.ttl}s TTL
                          </span>
                        </div>
                        <div className="text-2xs text-muted truncate">
                          {item.data.name} · {item.data.tier} · ₹{item.data.balance.toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* NODE 3: PostgreSQL Relational Database (Disk) */}
              <div className={`flex flex-col rounded-2xl border p-4 transition-all duration-300 ${
                activeStep === 'querying_db'
                  ? 'border-amber bg-amber/[0.07] shadow-lg shadow-amber/10'
                  : 'border-[#222838] bg-[#101420]'
              }`}>
                <div className="flex items-center justify-between border-b border-[#222838] pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <HardDrive size={16} className="text-cyan" />
                    <span className="font-plate text-xs font-bold text-white">PostgreSQL (NVMe Disk)</span>
                  </div>
                  <span className="text-2xs font-mono text-amber">50ms Disk & B-Tree</span>
                </div>

                <div className="flex-1 flex flex-col gap-2 font-mono text-2xs">
                  <div className="rounded-xl border border-[#222838] bg-[#0E1118] p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-chalk border-b border-line pb-1">
                      <span>TABLE: users</span>
                      <span className="text-emerald">PK: id</span>
                    </div>
                    {Object.values(MOCK_DB).map((row) => (
                      <div
                        key={row.id}
                        className={`flex items-center justify-between p-1 rounded transition-colors ${
                          row.id === activeKey && activeStep === 'querying_db'
                            ? 'bg-amber/20 text-white font-bold'
                            : 'text-slate-400'
                        }`}
                      >
                        <span>#{row.id} {row.name}</span>
                        <span className="text-slate-500">{row.tier}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto rounded-lg bg-[#0A0D14] p-2 border border-[#1A1F2C] text-muted">
                    <span className="block text-slate-500 mb-0.5">Physical Storage Cost:</span>
                    <span>1 Disk seek ≈ 100,000x slower than Redis RAM lookup.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: CACHE STAMPEDE & MUTEX LOCK SIMULATION */}
        {viewMode === 'stampede_mutex' && (
          <div className="flex flex-col gap-4 flex-1">
            {/* Stampede Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#222838] bg-[#121624] p-3 text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-chalk font-semibold">Distributed Mutex Protection:</span>
                  <button
                    type="button"
                    onClick={() => setMutexEnabled(!mutexEnabled)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1 font-mono text-xs font-bold transition-all ${
                      mutexEnabled
                        ? 'border border-emerald/60 bg-emerald/20 text-emerald'
                        : 'border border-crimson/60 bg-crimson/20 text-crimson'
                    }`}
                  >
                    {mutexEnabled ? <Lock size={12} /> : <Unlock size={12} />}
                    <span>{mutexEnabled ? 'ENABLED (SET NX EX 5)' : 'DISABLED (Broken Demo / Feel The Pain!)'}</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                disabled={isSimulatingStampede}
                onClick={handleSimulateStampede}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-xs font-bold transition-all shadow-md ${
                  mutexEnabled
                    ? 'bg-cyan text-slate-950 hover:bg-cyan-hi'
                    : 'bg-crimson text-white hover:bg-red-600 animate-pulse'
                } disabled:opacity-50`}
              >
                <Flame size={14} />
                <span>Simulate 50 Concurrent Spike (Key Expired)</span>
              </button>
            </div>

            {/* Stampede Telemetry & Event Log */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
              {/* Architecture Lock State */}
              <div className="flex flex-col rounded-2xl border border-[#222838] bg-[#101420] p-4 gap-3">
                <div className="flex items-center justify-between border-b border-[#222838] pb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className={mutexEnabled ? 'text-emerald' : 'text-crimson'} />
                    <span className="font-plate text-xs font-bold text-white">Concurrency Barrier State</span>
                  </div>
                  <span className="text-2xs font-mono text-muted">
                    {mutexLocked ? '🔒 Lock Held by Req #1' : '🔓 Lock Free'}
                  </span>
                </div>

                <div className="flex-1 flex flex-col justify-center items-center gap-3 p-4 bg-[#0A0D14] rounded-xl border border-[#1A1F2C]">
                  {mutexEnabled ? (
                    <div className="text-center space-y-2">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald/15 text-emerald border border-emerald/30">
                        <Lock size={24} />
                      </div>
                      <h4 className="font-plate text-sm font-bold text-chalk">Single-Flight Mutex Active</h4>
                      <p className="text-2xs font-mono text-muted max-w-xs">
                        Only 1 query slips through to PostgreSQL. Remaining 49 requests yield and await warm cache.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-crimson/15 text-crimson border border-crimson/30 animate-bounce">
                        <AlertTriangle size={24} />
                      </div>
                      <h4 className="font-plate text-sm font-bold text-crimson">Thundering Herd Danger!</h4>
                      <p className="text-2xs font-mono text-muted max-w-xs">
                        Without a mutex lock, all 50 concurrent requests simultaneously query the DB, crashing connection pools.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Event Logs Timeline */}
              <div className="flex flex-col rounded-2xl border border-[#222838] bg-[#101420] p-4">
                <div className="flex items-center justify-between border-b border-[#222838] pb-2 mb-2">
                  <span className="font-plate text-xs font-bold text-white">Live Execution Tracing</span>
                  <span className="text-2xs font-mono text-cyan">{stampedeSurgeRequests} threads</span>
                </div>
                <div className="flex-1 space-y-1.5 font-mono text-xs overflow-y-auto max-h-[220px] p-2 bg-[#0A0D14] rounded-xl border border-[#1A1F2C]">
                  {stampedeLogs.length === 0 ? (
                    <div className="text-2xs text-muted text-center pt-8">
                      Click "Simulate 50 Concurrent Spike" above to trace lock behavior.
                    </div>
                  ) : (
                    stampedeLogs.map((log, idx) => (
                      <div
                        key={idx}
                        className={`text-2xs leading-relaxed ${
                          log.includes('💥') || log.includes('🚨') || log.includes('❌')
                            ? 'text-crimson font-bold'
                            : log.includes('★') || log.includes('SUCCESS')
                            ? 'text-emerald font-semibold'
                            : 'text-slate-300'
                        }`}
                      >
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: dbdiagram.io STYLE RELATIONAL ENTITY SCHEMA */}
        {viewMode === 'dbdiagram_schema' && (
          <div className="flex flex-col gap-4 flex-1">
            <div className="flex items-center justify-between border-b border-[#222838] pb-2 text-xs font-mono text-muted">
              <span>dbdiagram.io Relational Architecture & Redis Key Namespace</span>
              <span className="text-cyan">PostgreSQL 16 Schema</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              {/* Table 1: users */}
              <div className="rounded-2xl border border-[#2E3446] bg-[#101420] overflow-hidden shadow-sm">
                <div className="flex items-center justify-between bg-[#181D2E] px-4 py-2.5 border-b border-[#2E3446]">
                  <div className="flex items-center gap-2">
                    <Database size={14} className="text-sky-400" />
                    <span className="font-mono text-xs font-bold text-white">public.users</span>
                  </div>
                  <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-2xs font-mono text-sky-300">Table</span>
                </div>
                <div className="p-3 font-mono text-xs divide-y divide-[#1F2538]">
                  <div className="flex items-center justify-between py-1.5 text-emerald font-semibold">
                    <span className="flex items-center gap-1.5"><Key size={12} /> id</span>
                    <span className="text-2xs text-slate-400">BIGSERIAL (PK)</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 text-chalk">
                    <span>email</span>
                    <span className="text-2xs text-slate-400">VARCHAR(255) UNIQUE</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 text-chalk">
                    <span>name</span>
                    <span className="text-2xs text-slate-400">VARCHAR(100)</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 text-chalk">
                    <span>balance</span>
                    <span className="text-2xs text-slate-400">NUMERIC(14,2)</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 text-chalk">
                    <span>tier</span>
                    <span className="text-2xs text-slate-400">VARCHAR(20)</span>
                  </div>
                </div>
              </div>

              {/* Table 2: Redis In-Memory KV Namespace */}
              <div className="rounded-2xl border border-[#2E3446] bg-[#101420] overflow-hidden shadow-sm">
                <div className="flex items-center justify-between bg-[#181D2E] px-4 py-2.5 border-b border-[#2E3446]">
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-amber" />
                    <span className="font-mono text-xs font-bold text-white">Redis Key-Value Namespace</span>
                  </div>
                  <span className="rounded bg-amber/20 px-1.5 py-0.5 text-2xs font-mono text-amber">In-Memory RAM</span>
                </div>
                <div className="p-3 font-mono text-xs space-y-3">
                  <div className="rounded-xl border border-[#222838] bg-[#0A0D14] p-3 space-y-1">
                    <span className="text-2xs text-cyan font-bold block">Key Template: user:&#123;id&#125;</span>
                    <div className="text-2xs text-slate-300">Type: Redis String (JSON) or Redis Hash</div>
                    <div className="text-2xs text-muted">TTL: 300s (volatile-lru eviction policy)</div>
                    <div className="text-2xs text-emerald">Sub-millisecond retrieval on primary memory bus</div>
                  </div>
                  <div className="rounded-xl border border-[#222838] bg-[#0A0D14] p-3 space-y-1">
                    <span className="text-2xs text-amber font-bold block">Lock Template: mutex:user:&#123;id&#125;</span>
                    <div className="text-2xs text-slate-300">Command: SET mutex:user:101 1 NX EX 5</div>
                    <div className="text-2xs text-muted">Prevents cache stampede / thundering herd</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
