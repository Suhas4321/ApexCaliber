import { useState, useEffect } from 'react'
import {
  Globe,
  ArrowRight,
  Wifi,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Layers,
} from 'lucide-react'
import type { VisualizerProps } from './types'

type NetworkMode = 'dns' | 'tcp'

interface DnsHop {
  title: string
  subtitle: string
  role: string
  type: 'client' | 'resolver' | 'root' | 'tld' | 'auth'
  query: string
  response: string
  latencyMs: number
}

const DNS_HOPS: DnsHop[] = [
  {
    title: '1. Client Browser',
    subtitle: '192.168.1.42',
    role: 'Originates DNS query: "What is the IP of pay.flipkart.com?" Checks local OS cache (Miss).',
    type: 'client',
    query: 'DNS Q: pay.flipkart.com (A)',
    response: 'Local OS cache miss',
    latencyMs: 1,
  },
  {
    title: '2. Recursive Resolver',
    subtitle: '8.8.8.8 (Google Public DNS)',
    role: 'ISP or Public recursive DNS server acting on behalf of the client. Checks recursive cache.',
    type: 'resolver',
    query: 'Forward recursive query',
    response: 'Resolver cache miss; begins root traversal',
    latencyMs: 12,
  },
  {
    title: '3. Root Nameserver',
    subtitle: '198.41.0.4 (a.root-servers.net)',
    role: 'Top of DNS hierarchy (13 global root IPs). Knows who manages all Top-Level Domains (.com, .org).',
    type: 'root',
    query: 'Iterative Q: pay.flipkart.com',
    response: 'Referral: Go ask .com TLD Nameserver (192.5.6.30)',
    latencyMs: 28,
  },
  {
    title: '4. TLD Nameserver',
    subtitle: '192.5.6.30 (a.gtld-servers.net)',
    role: 'Maintains records for all .com domains. Knows the authoritative nameservers for flipkart.com.',
    type: 'tld',
    query: 'Iterative Q: pay.flipkart.com',
    response: 'Referral: Go ask Authoritative ns1.flipkart.com',
    latencyMs: 34,
  },
  {
    title: '5. Authoritative Nameserver',
    subtitle: 'ns1.flipkart.com (Managed Route53 / Cloudflare)',
    role: 'The source of truth. Contains the official DNS zone file and A/CNAME records for flipkart.com.',
    type: 'auth',
    query: 'Iterative Q: pay.flipkart.com (A)',
    response: '★ Answer: pay.flipkart.com -> 163.53.78.92 (TTL=300s)',
    latencyMs: 22,
  },
]

interface TcpStep {
  step: number
  name: string
  direction: 'client_to_server' | 'server_to_client'
  flags: string[]
  seq: number
  ack: number
  clientState: string
  serverState: string
  explanation: string
}

const TCP_STEPS: TcpStep[] = [
  {
    step: 0,
    name: 'Initial State',
    direction: 'client_to_server',
    flags: [],
    seq: 0,
    ack: 0,
    clientState: 'CLOSED',
    serverState: 'LISTEN',
    explanation: 'Server socket is bound and listening on port 443. Client socket is idle in CLOSED state.',
  },
  {
    step: 1,
    name: 'Step 1: SYN (Synchronize)',
    direction: 'client_to_server',
    flags: ['SYN'],
    seq: 1000,
    ack: 0,
    clientState: 'SYN_SENT',
    serverState: 'LISTEN',
    explanation: 'Client generates random Initial Sequence Number (ISN=1000). Sends SYN packet to negotiate sequence tracking.',
  },
  {
    step: 2,
    name: 'Step 2: SYN-ACK (Acknowledge & Sync)',
    direction: 'server_to_client',
    flags: ['SYN', 'ACK'],
    seq: 5000,
    ack: 1001,
    clientState: 'SYN_SENT',
    serverState: 'SYN_RCVD',
    explanation: 'Server acknowledges client ISN (Ack=1001) and sends its own Initial Sequence Number (ISN=5000). Socket enters SYN_RCVD (backlog queue).',
  },
  {
    step: 3,
    name: 'Step 3: ACK (Connection Established)',
    direction: 'client_to_server',
    flags: ['ACK'],
    seq: 1001,
    ack: 5001,
    clientState: 'ESTABLISHED',
    serverState: 'ESTABLISHED',
    explanation: 'Client acknowledges server ISN (Ack=5001). Both ends are now in ESTABLISHED state. Full-duplex byte stream is active!',
  },
]

export default function NetworkPacketFlowVisualizer({ step: _step, config: _config }: VisualizerProps) {
  const [mode, setMode] = useState<NetworkMode>('dns')

  // DNS State
  const [activeDnsHop, setActiveDnsHop] = useState<number>(0)
  const [dnsPlaying, setDnsPlaying] = useState<boolean>(false)
  const [dnsCached, setDnsCached] = useState<boolean>(false)
  const totalDnsLatency = 97

  // TCP State
  const [tcpStepIndex, setTcpStepIndex] = useState<number>(0)
  const [tcpPlaying, setTcpPlaying] = useState<boolean>(false)
  const [packetDropped, setPacketDropped] = useState<boolean>(false)

  // DNS Animation Timer
  useEffect(() => {
    if (!dnsPlaying) return
    const timer = window.setInterval(() => {
      setActiveDnsHop((prev) => {
        if (prev >= DNS_HOPS.length - 1) {
          setDnsPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, 1800)
    return () => clearInterval(timer)
  }, [dnsPlaying])

  // TCP Animation Timer
  useEffect(() => {
    if (!tcpPlaying) return
    const timer = window.setInterval(() => {
      setTcpStepIndex((prev) => {
        if (prev >= TCP_STEPS.length - 1) {
          setTcpPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, 2200)
    return () => clearInterval(timer)
  }, [tcpPlaying])

  const activeTcp = TCP_STEPS[tcpStepIndex]

  return (
    <div className="flex h-full w-full flex-col gap-3 p-4 font-sans text-slate-200">
      {/* Top Header & Mode Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2E3446] pb-3">
        <div className="flex items-center gap-2">
          <Wifi size={18} className="text-sky-400" />
          <span className="font-plate text-sm font-bold tracking-wide text-chalk">
            Computer Networking & Protocol Sequence Flow
          </span>
          <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-2xs font-mono text-sky-400 font-semibold">
            Citadel VII Visualizer
          </span>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1 rounded-xl border border-[#2E3446] bg-[#0E1118] p-1 text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('dns')
              setActiveDnsHop(0)
              setDnsPlaying(false)
            }}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-all ${
              mode === 'dns' ? 'bg-sky-500 text-white font-bold shadow-sm' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <Globe size={13} /> 1. DNS Recursive Resolver
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('tcp')
              setTcpStepIndex(0)
              setTcpPlaying(false)
            }}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-all ${
              mode === 'tcp' ? 'bg-emerald text-slate-950 font-bold shadow-sm' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <Layers size={13} /> 2. TCP 3-Way Handshake
          </button>
        </div>
      </div>

      {/* Main Flow Canvas */}
      <div className="flex flex-1 flex-col gap-4 rounded-2xl border border-[#2E3446] bg-[#0A0D14] p-4 shadow-inner overflow-y-auto">
        {/* ========================================================================= */}
        {/* VIEW 1: DNS RECURSIVE RESOLUTION (LinkedIn / ByteByteGo style)            */}
        {/* ========================================================================= */}
        {mode === 'dns' && (
          <div className="flex flex-col gap-4 flex-1">
            {/* Playback & Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#222838] bg-[#101420] p-3 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (activeDnsHop >= DNS_HOPS.length - 1) setActiveDnsHop(0)
                    setDnsPlaying(!dnsPlaying)
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 font-mono text-xs font-bold text-white hover:bg-sky-400 transition-all shadow-sm"
                >
                  {dnsPlaying ? <Pause size={13} /> : <Play size={13} />}
                  <span>{dnsPlaying ? 'Pause Resolution' : 'Play Resolution Flow'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDnsHop((p) => Math.max(0, p - 1))}
                  disabled={activeDnsHop === 0}
                  className="rounded-lg border border-line bg-panel-2 px-2.5 py-1.5 text-xs text-muted hover:text-white disabled:opacity-30"
                >
                  ← Hop
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDnsHop((p) => Math.min(DNS_HOPS.length - 1, p + 1))}
                  disabled={activeDnsHop === DNS_HOPS.length - 1}
                  className="rounded-lg border border-line bg-panel-2 px-2.5 py-1.5 text-xs text-muted hover:text-white disabled:opacity-30"
                >
                  Hop →
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveDnsHop(0)
                    setDnsPlaying(false)
                    setDnsCached(false)
                  }}
                  className="rounded-lg border border-line bg-panel-2 p-1.5 text-muted hover:text-white"
                  title="Reset"
                >
                  <RotateCcw size={13} />
                </button>
              </div>

              <div className="flex items-center gap-3 font-mono text-2xs text-muted">
                <span>Domain: <strong className="text-cyan">pay.flipkart.com</strong></span>
                <span>Cumulative Latency: <strong className="text-amber">{dnsCached ? '1ms (Cache Hit)' : `${totalDnsLatency}ms`}</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    setDnsCached(!dnsCached)
                    setActiveDnsHop(dnsCached ? 0 : 1)
                  }}
                  className={`rounded-lg px-2.5 py-1 border transition-colors ${
                    dnsCached
                      ? 'border-emerald/50 bg-emerald/15 text-emerald font-bold'
                      : 'border-line bg-panel-2 text-muted hover:text-chalk'
                  }`}
                >
                  {dnsCached ? '★ Resolver Cache Hit Active' : 'Simulate Warm Cache (1ms)'}
                </button>
              </div>
            </div>

            {/* DNS Node Chain Diagram */}
            <div className="flex flex-wrap items-center justify-between gap-2 py-4">
              {DNS_HOPS.map((hop, idx) => {
                const isActive = activeDnsHop === idx
                const isPassed = activeDnsHop > idx

                return (
                  <div key={hop.title} className="flex items-center gap-2 flex-1 min-w-[150px]">
                    <button
                      type="button"
                      onClick={() => setActiveDnsHop(idx)}
                      className={`flex flex-col items-start rounded-xl p-3 border w-full text-left transition-all ${
                        isActive
                          ? 'border-sky-400 bg-sky-500/15 shadow-md shadow-sky-500/10 scale-105 z-10'
                          : isPassed
                          ? 'border-emerald/40 bg-emerald/5 hover:border-emerald/60'
                          : 'border-[#222838] bg-[#101420] opacity-60 hover:opacity-90'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-2xs font-mono font-bold text-sky-400">
                          {idx === 0 ? 'Client' : idx === 1 ? 'Resolver' : idx === 2 ? 'Root .' : idx === 3 ? 'TLD .com' : 'Auth NS'}
                        </span>
                        {isActive && <span className="h-2 w-2 rounded-full bg-sky-400 animate-ping" />}
                        {isPassed && <CheckCircle2 size={12} className="text-emerald" />}
                      </div>
                      <span className="font-plate text-xs font-bold text-chalk leading-tight truncate w-full">
                        {hop.title}
                      </span>
                      <span className="text-2xs font-mono text-muted truncate w-full mt-0.5">
                        {hop.subtitle}
                      </span>
                    </button>
                    {idx < DNS_HOPS.length - 1 && (
                      <ArrowRight size={14} className="text-muted shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Active DNS Hop Inspection Card */}
            <div className="rounded-2xl border border-[#2E3446] bg-[#101420] p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-[#222838] pb-2">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-sky-400" />
                  <h3 className="font-plate text-sm font-bold text-white">
                    {DNS_HOPS[activeDnsHop].title} — {DNS_HOPS[activeDnsHop].subtitle}
                  </h3>
                </div>
                <span className="text-2xs font-mono text-amber font-semibold">
                  +{DNS_HOPS[activeDnsHop].latencyMs}ms Hop Latency
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {DNS_HOPS[activeDnsHop].role}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="rounded-xl border border-[#222838] bg-[#0A0D14] p-3 font-mono text-xs space-y-1">
                  <span className="text-2xs text-faint block uppercase">Outbound Query Payload:</span>
                  <div className="text-cyan font-semibold">{DNS_HOPS[activeDnsHop].query}</div>
                </div>
                <div className="rounded-xl border border-[#222838] bg-[#0A0D14] p-3 font-mono text-xs space-y-1">
                  <span className="text-2xs text-faint block uppercase">Inbound Response Payload:</span>
                  <div className="text-emerald font-semibold">{DNS_HOPS[activeDnsHop].response}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: TCP 3-WAY HANDSHAKE (Interactive Sequence Diagram)                */}
        {/* ========================================================================= */}
        {mode === 'tcp' && (
          <div className="flex flex-col gap-4 flex-1">
            {/* Playback & Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#222838] bg-[#101420] p-3 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (tcpStepIndex >= TCP_STEPS.length - 1) setTcpStepIndex(0)
                    setTcpPlaying(!tcpPlaying)
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald px-3 py-1.5 font-mono text-xs font-bold text-slate-950 hover:bg-emerald-hi transition-all shadow-sm"
                >
                  {tcpPlaying ? <Pause size={13} /> : <Play size={13} />}
                  <span>{tcpPlaying ? 'Pause Handshake' : 'Play Handshake'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTcpStepIndex((p) => Math.max(0, p - 1))}
                  disabled={tcpStepIndex === 0}
                  className="rounded-lg border border-line bg-panel-2 px-2.5 py-1.5 text-xs text-muted hover:text-white disabled:opacity-30"
                >
                  ← Previous Step
                </button>
                <button
                  type="button"
                  onClick={() => setTcpStepIndex((p) => Math.min(TCP_STEPS.length - 1, p + 1))}
                  disabled={tcpStepIndex === TCP_STEPS.length - 1}
                  className="rounded-lg border border-line bg-panel-2 px-2.5 py-1.5 text-xs text-muted hover:text-white disabled:opacity-30"
                >
                  Next Step →
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTcpStepIndex(0)
                    setTcpPlaying(false)
                    setPacketDropped(false)
                  }}
                  className="rounded-lg border border-line bg-panel-2 p-1.5 text-muted hover:text-white"
                  title="Reset"
                >
                  <RotateCcw size={13} />
                </button>
              </div>

              <div className="flex items-center gap-3 font-mono text-2xs">
                <button
                  type="button"
                  onClick={() => setPacketDropped(!packetDropped)}
                  className={`rounded-lg px-2.5 py-1 border transition-colors ${
                    packetDropped
                      ? 'border-crimson bg-crimson/20 text-crimson font-bold'
                      : 'border-line bg-panel-2 text-muted hover:text-chalk'
                  }`}
                >
                  {packetDropped ? '🚨 Packet Loss Injected (RTO Timeout)' : 'Simulate Packet Loss Chaos'}
                </button>
              </div>
            </div>

            {/* Sequence Timelines (Client Lane ↔ Wire ↔ Server Lane) */}
            <div className="grid grid-cols-3 gap-4 items-stretch flex-1">
              {/* Client Column */}
              <div className="flex flex-col rounded-2xl border border-[#222838] bg-[#101420] p-4">
                <div className="flex items-center justify-between border-b border-[#222838] pb-2 mb-3">
                  <span className="font-plate text-xs font-bold text-white">Client (192.168.1.10)</span>
                  <span className="text-2xs font-mono text-muted">Port 52418</span>
                </div>
                <div className="flex-1 flex flex-col justify-center items-center gap-2">
                  <span className="text-2xs font-mono text-faint uppercase">Socket State:</span>
                  <span className={`px-3 py-1 rounded-full font-mono text-xs font-bold ${
                    activeTcp.clientState === 'ESTABLISHED'
                      ? 'bg-emerald/20 text-emerald border border-emerald/50'
                      : activeTcp.clientState === 'SYN_SENT'
                      ? 'bg-amber/20 text-amber border border-amber/50 animate-pulse'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {activeTcp.clientState}
                  </span>
                </div>
              </div>

              {/* Wire / Packet Transit Lane */}
              <div className="flex flex-col justify-center items-center rounded-2xl border border-[#222838] bg-[#0A0D14] p-4 relative">
                <div className="text-2xs font-mono text-muted mb-4 uppercase tracking-wider">
                  Network Wire (RTT ≈ 32ms)
                </div>

                {tcpStepIndex === 0 ? (
                  <span className="text-2xs font-mono text-faint italic">No packet on wire.</span>
                ) : (
                  <div className={`w-full rounded-xl border p-3 font-mono text-xs transition-all shadow-md ${
                    packetDropped
                      ? 'border-crimson bg-crimson/15 text-crimson'
                      : 'border-cyan bg-cyan/15 text-white'
                  }`}>
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span>Flags: [{activeTcp.flags.join(', ')}]</span>
                      <span>Seq={activeTcp.seq}</span>
                    </div>
                    <div className="flex items-center justify-between text-2xs text-slate-300">
                      <span>Ack={activeTcp.ack}</span>
                      <span>Length=0 bytes</span>
                    </div>
                    <div className="text-center font-bold text-2xs text-cyan mt-2">
                      {activeTcp.direction === 'client_to_server' ? 'Client ➔ ➔ Server' : 'Server ➔ ➔ Client'}
                    </div>
                  </div>
                )}
              </div>

              {/* Server Column */}
              <div className="flex flex-col rounded-2xl border border-[#222838] bg-[#101420] p-4">
                <div className="flex items-center justify-between border-b border-[#222838] pb-2 mb-3">
                  <span className="font-plate text-xs font-bold text-white">Server (142.250.190.46)</span>
                  <span className="text-2xs font-mono text-muted">Port 443 (HTTPS)</span>
                </div>
                <div className="flex-1 flex flex-col justify-center items-center gap-2">
                  <span className="text-2xs font-mono text-faint uppercase">Socket State:</span>
                  <span className={`px-3 py-1 rounded-full font-mono text-xs font-bold ${
                    activeTcp.serverState === 'ESTABLISHED'
                      ? 'bg-emerald/20 text-emerald border border-emerald/50'
                      : activeTcp.serverState === 'SYN_RCVD'
                      ? 'bg-amber/20 text-amber border border-amber/50 animate-pulse'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {activeTcp.serverState}
                  </span>
                </div>
              </div>
            </div>

            {/* Step Explanation Card */}
            <div className="rounded-2xl border border-[#2E3446] bg-[#101420] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-plate text-xs font-bold text-white">{activeTcp.name}</h4>
                <span className="text-2xs font-mono text-cyan">Step {tcpStepIndex + 1} of 4</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {packetDropped && tcpStepIndex > 0
                  ? '🚨 PACKET DROPPED BY ROUTER CONGESTION! Client will wait for Retransmission Timeout (RTO) before resending.'
                  : activeTcp.explanation}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
