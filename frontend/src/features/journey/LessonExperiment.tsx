import { useState } from 'react'
import { ArrowRight, Database, Film, HardDrive, RotateCcw, Terminal } from 'lucide-react'
import type { JourneyStage, QuestionDetail, VisualizerKind } from '../../api/types'
import { Markdown } from '../../components/ui'
import VisualizerHost from '../../components/visualizers/VisualizerHost'
import DeadlockMotionGraphic from './experiments/DeadlockMotionGraphic'
import VirtualMemoryMotionGraphic from './experiments/VirtualMemoryMotionGraphic'
import TcpHandshakeMotionGraphic from './experiments/TcpHandshakeMotionGraphic'
import DnsResolutionMotionGraphic from './experiments/DnsResolutionMotionGraphic'
import AcidTransactionsMotionGraphic from './experiments/AcidTransactionsMotionGraphic'
import RedisCacheMotionGraphic from './experiments/RedisCacheMotionGraphic'
import RefreshTokenRotationMotionGraphic from './experiments/RefreshTokenRotationMotionGraphic'
import GilConcurrencyMotionGraphic from './experiments/GilConcurrencyMotionGraphic'
import AsyncJobPollingMotionGraphic from './experiments/AsyncJobPollingMotionGraphic'
import VectorRagMotionGraphic from './experiments/VectorRagMotionGraphic'
import AgentStateGraphMotionGraphic from './experiments/AgentStateGraphMotionGraphic'
import BTreeVsHashIndexMotionGraphic from './experiments/BTreeVsHashIndexMotionGraphic'
import FastApiAsyncDefMotionGraphic from './experiments/FastApiAsyncDefMotionGraphic'

/** Only show controls when a lesson-specific model consumes their values. */
export default function LessonExperiment({ stage, question }: { stage: JourneyStage; question: QuestionDetail }) {
  const [values, setValues] = useState<Record<string, unknown>>(() => Object.fromEntries((stage.controls || []).map(c => [c.id, c.default])))
  const [scanned, setScanned] = useState(false)
  const [motionViewMode, setMotionViewMode] = useState<'motion' | 'code'>('motion')
  const heap = stage.id === 'w17_s1_flat_file_illusion'
  const http = stage.id === 'w17_s1_why_http'
  const isDeadlock = question.slug === 'deadlock-cycle-detector' || stage.id.startsWith('w27_')
  const isVirtualMemory = question.slug === 'virtual-memory-page-replacement' || stage.id.startsWith('w42_')
  const isTcpHandshake = question.slug === 'tcp-three-way-handshake' || stage.id.startsWith('w41_')
  const isDnsResolution = question.slug === 'dns-recursive-resolver' || stage.id.startsWith('w40_')
  const isAcidTransactions = question.slug === 'sql-lost-update-optimistic-lock' || question.slug === 'sql-acid-money-transfer' || stage.id.startsWith('w25_')
  const isRedisCache = question.slug === 'redis-cache-stampede-mutex' || question.slug === 'redis-cache-aside-strategy' || stage.id.startsWith('w39_')
  const isTokenRotation = question.slug === 'refresh-token-rotation-reuse' || question.slug === 'hmac-signed-jwt-engine' || stage.id.startsWith('w31_')
  const isGilConcurrency = question.slug === 'thread-vs-process-pool-advisor' || stage.id.startsWith('w28_') || question.citadel_id === 'gil_concurrency'
  const isAsyncJobPolling = question.slug === 'http-202-polling-backoff' || stage.id.startsWith('w33_')
  const isVectorRag = question.slug === 'rag-cross-encoder-reranker' || question.slug === 'rag-text-chunker-with-overlap' || stage.id.startsWith('w35_')
  const isAgentStateGraph = question.slug === 'agent-state-machine-graph' || question.slug === 'agent-tool-calling-loop' || stage.id.startsWith('w36_')
  const isBTreeIndex = question.slug === 'btree-vs-hash-indexes' || question.slug === 'sql-explain-composite-index' || question.slug === 'composite-index-left-prefix' || stage.id.startsWith('w22_')
  const isFastApiAsync = question.slug === 'sync-vs-async-handler-throughput' || question.slug === 'asyncio-event-loop-semaphore' || stage.id.startsWith('w32_')
  const modeled = heap || http || isDeadlock || isVirtualMemory || isTcpHandshake || isDnsResolution || isAcidTransactions || isRedisCache || isTokenRotation || isGilConcurrency || isAsyncJobPolling || isVectorRag || isAgentStateGraph || isBTreeIndex || isFastApiAsync
  const topicSandboxes = new Set(['http_lifecycle', 'network_flow', 'concurrency_timeline', 'cache_relational'])
  const hasTopicSandbox = topicSandboxes.has(stage.visualizer_type || '') || (stage.visualizer_type === 'system_blueprint' && question.citadel_id === 'ai_resume')
  const rows = Math.max(1, Number(values.table_rows) || 1000)
  const capacity = Math.max(1, Number(values.page_capacity) || 10)
  const pages = Math.ceil(rows / capacity)
  const framed = Boolean(values.use_http_framing)
  const payloadSize = Number(values.payload_size_bytes) || 256

  if (!modeled) {
    // Many authored stages currently point to unrelated, hardcoded sandboxes. A worked
    // example is an honest fallback until a topic-specific interactive model exists.
    return <div className="lesson-worked-example">
      <span className="lesson-eyebrow">Worked example</span>
      <div className="lesson-prose"><Markdown>{stage.scenario}</Markdown></div>
      <p className="lesson-muted">Trace the example below and consider which step supports your prediction. This lesson uses a code walkthrough; you can execute the question’s tests in the practice editor.</p>
      <pre><code>{stage.lab_starter_code || question.content!.starter_code}</code></pre>
      <details className="lesson-reference"><summary>Example inputs and expected outputs</summary>
        {question.content!.statement.examples.map((example, i) => <div key={i} className="lesson-example"><p><strong>Input</strong> {example.input}</p><p><strong>Output</strong> {example.output}</p>{example.explanation && <Markdown>{example.explanation}</Markdown>}</div>)}
      </details>
      {hasTopicSandbox && <details className="lesson-reference"><summary>Explore the related topic sandbox</summary><p>This broader sandbox has its own controls. Use the worked example above for this specific lesson.</p><div className="lesson-sandbox" data-zone="night">
        <VisualizerHost inline kind={stage.visualizer_type as VisualizerKind} steps={[]} index={0} code="" step={{ event: 'line', line: 1, func: '', depth: 0, frames: [], heap: {} }} config={stage.visualizer_config || {}} />
      </div></details>}
    </div>
  }

  if (isDeadlock || isVirtualMemory || isTcpHandshake || isDnsResolution || isAcidTransactions || isRedisCache || isTokenRotation || isGilConcurrency || isAsyncJobPolling || isVectorRag || isAgentStateGraph || isBTreeIndex || isFastApiAsync) {
    return (
      <div className="w-full space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-2 mb-2">
          <div className="inline-flex rounded-lg border border-line bg-panel-2 p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setMotionViewMode('motion')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                motionViewMode === 'motion'
                  ? 'bg-panel-3 text-brand-light font-semibold shadow-xs'
                  : 'text-muted hover:text-chalk'
              }`}
            >
              <Film size={13} />
              <span>Cinematic Motion Graphic</span>
            </button>
            <button
              type="button"
              onClick={() => setMotionViewMode('code')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                motionViewMode === 'code'
                  ? 'bg-panel-3 text-brand-light font-semibold shadow-xs'
                  : 'text-muted hover:text-chalk'
              }`}
            >
              <Terminal size={13} />
              <span>Code Walkthrough</span>
            </button>
          </div>
        </div>

        {motionViewMode === 'motion' ? (
          isDeadlock ? (
            <DeadlockMotionGraphic />
          ) : isVirtualMemory ? (
            <VirtualMemoryMotionGraphic />
          ) : isTcpHandshake ? (
            <TcpHandshakeMotionGraphic />
          ) : isDnsResolution ? (
            <DnsResolutionMotionGraphic />
          ) : isAcidTransactions ? (
            <AcidTransactionsMotionGraphic />
          ) : isRedisCache ? (
            <RedisCacheMotionGraphic />
          ) : isTokenRotation ? (
            <RefreshTokenRotationMotionGraphic />
          ) : isGilConcurrency ? (
            <GilConcurrencyMotionGraphic />
          ) : isAsyncJobPolling ? (
            <AsyncJobPollingMotionGraphic />
          ) : isVectorRag ? (
            <VectorRagMotionGraphic />
          ) : isAgentStateGraph ? (
            <AgentStateGraphMotionGraphic />
          ) : isBTreeIndex ? (
            <BTreeVsHashIndexMotionGraphic />
          ) : (
            <FastApiAsyncDefMotionGraphic />
          )
        ) : (
          <div className="lesson-worked-example">
            <span className="lesson-eyebrow">Worked example</span>
            <div className="lesson-prose"><Markdown>{stage.scenario}</Markdown></div>
            <p className="lesson-muted">Trace the example below and consider which step supports your prediction. This lesson uses a code walkthrough; you can execute the question’s tests in the practice editor.</p>
            <pre><code>{stage.lab_starter_code || question.content!.starter_code}</code></pre>
            <details className="lesson-reference"><summary>Example inputs and expected outputs</summary>
              {question.content!.statement.examples.map((example, i) => (
                <div key={i} className="lesson-example">
                  <p><strong>Input</strong> {example.input}</p>
                  <p><strong>Output</strong> {example.output}</p>
                  {example.explanation && <Markdown>{example.explanation}</Markdown>}
                </div>
              ))}
            </details>
          </div>
        )}
      </div>
    )
  }

  return <div className="lesson-experiment">
    <div className="experiment-controls">
      <span className="lesson-eyebrow">Adjust the model</span>
      {(stage.controls || []).map(control => <div className="experiment-control" key={control.id}>
        <label htmlFor={`control-${control.id}`}>{control.label}</label>
        {control.type === 'slider' && <>
          <output htmlFor={`control-${control.id}`}>{Number(values[control.id]).toLocaleString()}</output>
          <input id={`control-${control.id}`} type="range" min={control.min ?? 0} max={control.max ?? 100} step={control.step ?? 1} value={Number(values[control.id])} onChange={e => { setValues(v => ({ ...v, [control.id]: Number(e.target.value) })); setScanned(false) }} />
        </>}
        {control.type === 'toggle' && <label className="experiment-toggle"><input id={`control-${control.id}`} type="checkbox" checked={Boolean(values[control.id])} onChange={e => setValues(v => ({ ...v, [control.id]: e.target.checked }))} /><span>{values[control.id] ? 'Enabled' : 'Disabled'}</span></label>}
        <p>{control.description}</p>
      </div>)}
      <button className="lesson-link" onClick={() => { setValues(Object.fromEntries((stage.controls || []).map(c => [c.id, c.default]))); setScanned(false) }}><RotateCcw size={14} /> Reset experiment</button>
    </div>
    <div className="experiment-canvas">
      {heap ? <>
        <div className="experiment-caption"><HardDrive size={17} /><span>Table on disk</span><span>{pages.toLocaleString()} pages</span></div>
        <div className="heap-pages" aria-label={`${pages} database pages, each with capacity for ${capacity} records`}>
          {Array.from({ length: Math.min(pages, 8) }, (_, i) => <div key={i} className={`heap-page ${scanned ? 'is-read' : ''}`}><span>Page {i + 1}</span><div>{Array.from({ length: Math.min(capacity, 12) }, (_, j) => <i key={j} />)}</div><small>8 KiB</small></div>)}
        </div>
        {pages > 8 && <p className="lesson-muted">First 8 pages shown · {(pages - 8).toLocaleString()} more pages on disk</p>}
        <div className="experiment-transfer"><HardDrive size={20} /><span>Read whole pages</span><ArrowRight size={22} /><Database size={20} /><span>Buffer pool</span></div>
        <button className="lesson-secondary" onClick={() => setScanned(true)}>Scan for a missing record <ArrowRight size={15} /></button>
        <div className="experiment-result" aria-live="polite">{scanned ? <><strong>{pages.toLocaleString()} pages · {(pages * 8).toLocaleString()} KiB read</strong><p>With a cold cache and no index, finding that a record is absent requires scanning every page. More records per page means fewer page reads.</p></> : <><strong>How much data will the database read?</strong><p>Run a scan, then change the table size or page capacity and compare.</p></>}</div>
        <p className="experiment-footnote">Simplified model: 8 KiB database pages, a cold cache, fixed record capacity, no compression or index. Disk sectors and database pages are different units.</p>
      </> : <>
        <div className="experiment-caption"><span>Two messages. One TCP byte stream.</span></div>
        <div className="http-messages">{[1, 2].map(i => <div className={`http-message ${framed ? 'is-framed' : ''}`} key={i}><span>Request {i}</span>{framed && <code>Content-Length: {payloadSize}<br /><br /></code>}<div className="http-payload">{payloadSize} bytes of JSON</div></div>)}</div>
        <div className="experiment-transfer"><span>Client</span><ArrowRight size={22} /><span>TCP stream</span><ArrowRight size={22} /><span>Server parser</span></div>
        <div className="experiment-result" aria-live="polite"><strong>{framed ? 'The parser can locate both message boundaries.' : 'TCP alone does not define message boundaries.'}</strong><p>{framed ? `In this simplified HTTP/1.1 example, each Content-Length tells the parser to consume ${payloadSize} body bytes before parsing the next request.` : 'TCP preserves byte order, but reads may split or combine writes. The application needs a framing rule to separate messages.'}</p></div>
        <p className="experiment-footnote">Illustrative HTTP/1.1 model. Chunked transfer and protocols such as HTTP/2 use other framing rules.</p>
      </>}
    </div>
  </div>
}
