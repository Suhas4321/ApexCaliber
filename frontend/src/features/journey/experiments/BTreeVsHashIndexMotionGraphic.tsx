import { useState, useEffect, useRef } from 'react'
import { Database, Search, ArrowRightLeft, AlertTriangle } from 'lucide-react'
import MotionGraphicPlayer from '../../../components/motion/MotionGraphicPlayer'

export default function BTreeVsHashIndexMotionGraphic() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState<number>(0.5) // default to 0.5x slow walkthrough
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [strategyMode, setStrategyMode] = useState<'range_query' | 'point_query' | 'composite_prefix'>('range_query')

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
    }
    setIsPlaying(!isPlaying)
  }

  const handleReplay = () => {
    setCurrentTime(0)
    setIsPlaying(true)
  }

  const handleSeek = (time: number) => {
    setCurrentTime(time)
  }

  // Derived state across the 4 acts
  let subtitle = ''
  let metrics: { label: string; value: string; variant?: 'default' | 'success' | 'warning' | 'danger' }[] = []

  let btreeHops = 0
  let hashHops = 0
  let optimizerPath = 'OPTIMIZING'
  let activeBTreePage = 'Root (Page 1)'
  let activeHashBucket = 'Bucket 0'

  if (strategyMode === 'range_query') {
    if (currentTime < 3.0) {
      // Act 1: Query Emission
      btreeHops = 0
      hashHops = 0
      optimizerPath = 'PARSING SQL'
      activeBTreePage = 'Ready at Root (Page 1)'
      activeHashBucket = 'Evaluating Hash Keys'
      subtitle = 'Act 1 (0.0s – 3.0s): Query emitted: `SELECT * FROM employees WHERE id BETWEEN 20 AND 35`. Query optimizer evaluates available index structures.'
      metrics = [
        { label: 'Query Target', value: 'WHERE id BETWEEN 20 AND 35', variant: 'default' },
        { label: 'B+ Tree Depth', value: '3 Levels (Page Size: 8 KiB)', variant: 'default' },
        { label: 'Hash Function', value: 'h(k) = k % 8 (Buckets: 8)', variant: 'default' },
        { label: 'Disk Page I/O', value: '0 Blocks Read', variant: 'default' },
      ]
    } else if (currentTime < 6.0) {
      // Act 2: B+ Tree Point Seek to Range Start
      btreeHops = 2
      hashHops = 0
      optimizerPath = 'BTREE_DESCENDING'
      activeBTreePage = 'Page 1 -> Page 3 -> Leaf Page 5'
      activeHashBucket = 'Unordered Bucket Scatter'
      subtitle = 'Act 2 (3.0s – 6.0s): B+ Tree navigates Root (Page 1) to find boundary 20. Direct tree descent reaches Leaf Page 5 in O(log_B N) hops.'
      metrics = [
        { label: 'B+ Tree Seek', value: 'Root [Page 1] → Leaf [Page 5]', variant: 'default' },
        { label: 'B+ Tree I/O', value: '2 Page Hops (O(log N))', variant: 'success' },
        { label: 'Hash Evaluation', value: 'h(20)=4, h(25)=1, h(30)=6, h(35)=3', variant: 'warning' },
        { label: 'Hash Locality', value: '0% Spatial Locality', variant: 'danger' },
      ]
    } else if (currentTime < 9.0) {
      // Act 3: Sibling Pointer Traversal vs Full Table Scan
      btreeHops = 4
      hashHops = 1000
      optimizerPath = 'BTREE_LEAF_SCAN vs HASH_TABLE_SCAN'
      activeBTreePage = 'Leaf Page 5 ⇄ Leaf Page 6'
      activeHashBucket = 'ABANDONED → FULL TABLE SCAN'
      subtitle = 'Act 3 (6.0s – 9.0s): Key Insight! B+ Tree walks horizontal sibling pointers (Page 5 ⇄ Page 6). Hash Index completely fails ranges, forcing a 1,000-page Full Table Scan!'
      metrics = [
        { label: 'B+ Tree Range Walk', value: 'Sibling Pointer (Page 5 → 6)', variant: 'success' },
        { label: 'B+ Tree Total I/O', value: '4 Disk Pages Read', variant: 'success' },
        { label: 'Hash Failure', value: 'Hash cannot order keys', variant: 'danger' },
        { label: 'Table Scan Penalty', value: '1,000 Pages (SCAN TABLE)', variant: 'danger' },
      ]
    } else {
      // Act 4: Resolution & EXPLAIN QUERY PLAN
      btreeHops = 4
      hashHops = 1000
      optimizerPath = 'RESOLVED: BTREE WINS RANGE'
      activeBTreePage = 'Page 5, 6 (Cached in Buffer Pool)'
      activeHashBucket = 'Seq Scan Disaster'
      subtitle = 'Act 4 (9.0s – 12.0s): EXPLAIN QUERY PLAN: B+ Tree outputs `SEARCH TABLE USING INDEX`. Hash forces catastrophic full table scan. B+ Tree is the relational default!'
      metrics = [
        { label: 'B+ Tree Plan', value: 'SEARCH TABLE USING INDEX', variant: 'success' },
        { label: 'Hash Plan', value: 'SCAN TABLE (1,000 I/Os)', variant: 'danger' },
        { label: 'Sequential Prefetch', value: 'Active via Leaf Sibling Links', variant: 'success' },
        { label: 'Verdict', value: 'B+ Tree Wins (4 vs 1,000 I/Os)', variant: 'success' },
      ]
    }
  } else if (strategyMode === 'point_query') {
    if (currentTime < 3.0) {
      btreeHops = 0
      hashHops = 0
      optimizerPath = 'PARSING SQL'
      activeBTreePage = 'Root (Page 1)'
      activeHashBucket = 'Bucket Array'
      subtitle = 'Act 1 (0.0s – 3.0s): Exact equality lookup emitted: `SELECT * FROM employees WHERE id = 42`. Evaluating point lookup performance.'
      metrics = [
        { label: 'Query Target', value: 'WHERE id = 42 (Equality)', variant: 'default' },
        { label: 'B+ Tree Strategy', value: 'Root to Leaf Descent', variant: 'default' },
        { label: 'Hash Strategy', value: 'Direct Bucket Math: h(42) = 2', variant: 'default' },
        { label: 'Expected Speed', value: 'Hash O(1) vs B+ Tree O(log N)', variant: 'default' },
      ]
    } else if (currentTime < 6.0) {
      btreeHops = 2
      hashHops = 1
      optimizerPath = 'POINT_SEEKING'
      activeBTreePage = 'Page 1 → Page 3'
      activeHashBucket = 'Bucket 2 (Direct Hit)'
      subtitle = 'Act 2 (3.0s – 6.0s): Hash function computes `h(42) = 2` and jumps directly to Bucket 2 in 1 I/O hop. B+ Tree reads Root Page 1.'
      metrics = [
        { label: 'Hash Point Lookup', value: '1 I/O Hop (Instant O(1))', variant: 'success' },
        { label: 'B+ Tree Descent', value: 'Traversing Internal Page 3', variant: 'default' },
        { label: 'Hash Bucket Slot', value: 'Bucket 2 → Slot 0 (Key 42)', variant: 'success' },
        { label: 'Latency Comparison', value: 'Hash leads by 2 I/Os', variant: 'default' },
      ]
    } else if (currentTime < 9.0) {
      btreeHops = 3
      hashHops = 1
      optimizerPath = 'DATA_RESOLVED'
      activeBTreePage = 'Leaf Page 6 (Found Key 42)'
      activeHashBucket = 'Bucket 2 Completed'
      subtitle = 'Act 3 (6.0s – 9.0s): B+ Tree reaches Leaf Page 6 in 3 hops. Hash index finishes in 1 hop. Hash Index wins exact-match point lookups.'
      metrics = [
        { label: 'Hash Total I/O', value: '1 Page Read (O(1))', variant: 'success' },
        { label: 'B+ Tree Total I/O', value: '3 Pages Read (O(log_B N))', variant: 'default' },
        { label: 'Payload Fetched', value: 'Employee Record #42', variant: 'success' },
        { label: 'Trade-off', value: 'Hash is 3x faster on exact match', variant: 'success' },
      ]
    } else {
      btreeHops = 3
      hashHops = 1
      optimizerPath = 'RESOLVED: HASH WINS POINT'
      activeBTreePage = 'Page 6 Complete'
      activeHashBucket = 'Bucket 2 Complete'
      subtitle = 'Act 4 (9.0s – 12.0s): Summary: Hash indexes excel at pure key-value point queries, but sacrifice sorting and range scanning capabilities.'
      metrics = [
        { label: 'Hash Score', value: '1 I/O (Optimal for KV)', variant: 'success' },
        { label: 'B+ Tree Score', value: '3 I/O (Acceptable Overhead)', variant: 'default' },
        { label: 'Memory Footprint', value: 'Hash requires dynamic rehashing', variant: 'warning' },
        { label: 'Production Verdict', value: 'Used for memory cache / Redis', variant: 'default' },
      ]
    }
  } else {
    // Composite Left-Prefix Rule
    if (currentTime < 3.0) {
      btreeHops = 0
      hashHops = 0
      optimizerPath = 'CHECKING_PREFIX'
      activeBTreePage = 'Composite idx_dept_salary'
      activeHashBucket = 'N/A (Multi-column)'
      subtitle = 'Act 1 (0.0s – 3.0s): Query: `WHERE dept_id = 10 AND salary >= 80000`. Evaluating composite index `(dept_id, salary)` left-prefix ordering.'
      metrics = [
        { label: 'Composite Index', value: '(dept_id, salary, hire_date)', variant: 'default' },
        { label: 'Leading Column', value: 'dept_id = 10 (Matched)', variant: 'success' },
        { label: 'Secondary Column', value: 'salary >= 80000 (Range Seek)', variant: 'default' },
        { label: 'Left-Prefix Rule', value: 'Satisfied by Query Filter', variant: 'success' },
      ]
    } else if (currentTime < 6.0) {
      btreeHops = 2
      hashHops = 0
      optimizerPath = 'BTREE_PREFIX_SEEK'
      activeBTreePage = 'Dept 10 Partition (Page 2)'
      activeHashBucket = 'N/A'
      subtitle = 'Act 2 (3.0s – 6.0s): Leading column `dept_id = 10` narrows tree branch immediately. B+ Tree drops straight into the dept 10 partition.'
      metrics = [
        { label: 'Branch Routing', value: 'Filtered to dept_id = 10 branch', variant: 'success' },
        { label: 'Skipped Partitions', value: 'dept_id in [1..9, 11..50] bypassed', variant: 'success' },
        { label: 'Index Seek Type', value: 'SEARCH TABLE USING INDEX', variant: 'success' },
        { label: 'Page Hops', value: '2 Levels to Partition Leaf', variant: 'default' },
      ]
    } else if (currentTime < 9.0) {
      btreeHops = 3
      hashHops = 1000
      optimizerPath = 'PREFIX_COMPARISON'
      activeBTreePage = 'Dept 10 Salary Leaf Walk'
      activeHashBucket = 'Missing dept_id -> Full Scan'
      subtitle = 'Act 3 (6.0s – 9.0s): Contrast: What if query filtered `WHERE salary >= 80000` WITHOUT `dept_id`? Left-prefix violated! Planner triggers Full Table Scan!'
      metrics = [
        { label: 'With Leading dept_id', value: '3 I/O hops (Index Seek)', variant: 'success' },
        { label: 'Without Leading dept_id', value: '1,000 I/O (SCAN TABLE Full Scan)', variant: 'danger' },
        { label: 'Left-Prefix Rule', value: 'Must query left-to-right columns', variant: 'warning' },
        { label: 'Index Skip Scan', value: 'Only in advanced MySQL 8.0+', variant: 'default' },
      ]
    } else {
      btreeHops = 3
      hashHops = 1000
      optimizerPath = 'RESOLVED: PREFIX DEMONSTRATED'
      activeBTreePage = 'Dept 10 Partition Sorted'
      activeHashBucket = 'Full Scan Avoided'
      subtitle = 'Act 4 (9.0s – 12.0s): `EXPLAIN QUERY PLAN` confirms: `idx_dept_salary (dept_id=?)` avoids file sort because B+ Tree maintains leaf order!'
      metrics = [
        { label: 'Access Path', value: 'SEARCH TABLE ... USING INDEX', variant: 'success' },
        { label: 'Sort Elimination', value: 'ORDER BY salary satisfied by index', variant: 'success' },
        { label: 'Write Amplification', value: '1 composite vs 2 single indexes', variant: 'success' },
        { label: 'Architect Verdict', value: 'Always align filters to left prefix', variant: 'success' },
      ]
    }
  }

  // Animation percentage for sibling pointer particle
  const p3 = Math.min(1, Math.max(0, (currentTime - 6.0) / 3.0))

  return (
    <div className="w-full space-y-4">
      {/* Strategy Selector Deck */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-panel-2 p-3 rounded-xl border border-line">
        <div className="flex items-center gap-2">
          <Database size={16} className="text-brand-light" />
          <span className="text-xs font-semibold text-chalk uppercase tracking-wider">
            DBMS Storage Engine Architecture Mode:
          </span>
        </div>
        <div className="inline-flex rounded-lg border border-line bg-panel p-0.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setStrategyMode('range_query')
              setCurrentTime(0)
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
              strategyMode === 'range_query'
                ? 'bg-panel-3 text-brand-light font-bold shadow-xs'
                : 'text-muted hover:text-chalk'
            }`}
          >
            <ArrowRightLeft size={13} />
            <span>Range Scan (BETWEEN 20 AND 35)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setStrategyMode('point_query')
              setCurrentTime(0)
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
              strategyMode === 'point_query'
                ? 'bg-panel-3 text-brand-light font-bold shadow-xs'
                : 'text-muted hover:text-chalk'
            }`}
          >
            <Search size={13} />
            <span>Point Lookup (WHERE id = 42)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setStrategyMode('composite_prefix')
              setCurrentTime(0)
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
              strategyMode === 'composite_prefix'
                ? 'bg-panel-3 text-brand-light font-bold shadow-xs'
                : 'text-muted hover:text-chalk'
            }`}
          >
            <AlertTriangle size={13} />
            <span>Composite Left-Prefix Rule</span>
          </button>
        </div>
      </div>

      {/* Main Motion Graphic Player */}
      <MotionGraphicPlayer
        title="DBMS Storage Engine: B+ Tree vs. Hash Index & Left-Prefix Traversal"
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
      >
        {(theme) => {
          const isLight = theme === 'light'
          // Studio Theme Colors
          const bgCanvas = isLight ? '#f8fafc' : '#030712'
          const cardBg = isLight ? '#ffffff' : '#0f172a'
          const cardBorder = isLight ? '#e2e8f0' : '#1e293b'
          const textPrimary = isLight ? '#0f172a' : '#f8fafc'
          const textSecondary = isLight ? '#64748b' : '#94a3b8'

          const btreeCyan = '#06b6d4'
          const btreeGlow = 'rgba(6, 182, 212, 0.4)'
          const hashPurple = '#a855f7'
          const hashGlow = 'rgba(168, 85, 247, 0.4)'
          const leafEmerald = '#10b981'
          const tableScanRed = '#ef4444'
          const amberWarning = '#f59e0b'

          return (
            <svg
              viewBox="0 0 1000 500"
              className="w-full h-auto select-none"
              style={{ backgroundColor: bgCanvas }}
            >
              <defs>
                <filter id="btree-shadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity={isLight ? '0.06' : '0.4'} />
                </filter>
                <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={btreeGlow} />
                </filter>
                <filter id="glow-purple" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={hashGlow} />
                </filter>
                <marker
                  id="arrow-cyan"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill={btreeCyan} />
                </marker>
                <marker
                  id="arrow-emerald"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill={leafEmerald} />
                </marker>
                <marker
                  id="arrow-purple"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill={hashPurple} />
                </marker>
              </defs>

              {/* Background Grid Pattern */}
              <pattern id="grid-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill={isLight ? '#cbd5e1' : '#1e293b'} opacity="0.4" />
              </pattern>
              <rect width="1000" height="500" fill="url(#grid-pattern)" />

              {/* ========================================================= */}
              {/* LEFT HALF: B+ TREE STORAGE ENGINE (x: 20 to 520)         */}
              {/* ========================================================= */}
              <g transform="translate(20, 20)">
                <rect
                  x="0"
                  y="0"
                  width="500"
                  height="460"
                  rx="12"
                  fill={cardBg}
                  stroke={cardBorder}
                  strokeWidth="1.5"
                  filter="url(#btree-shadow)"
                />

                {/* Header */}
                <rect x="0" y="0" width="500" height="38" rx="12" fill={isLight ? '#f0fdfa' : '#042f2e'} />
                <path d="M 0 12 Q 0 0 12 0 L 488 0 Q 500 0 500 12 L 500 38 L 0 38 Z" fill={isLight ? '#f0fdfa' : '#042f2e'} />
                <circle cx="20" cy="19" r="6" fill={btreeCyan} />
                <text x="34" y="23" fill={textPrimary} fontSize="12" fontWeight="700">
                  B+ TREE STORAGE ENGINE (PostgreSQL / InnoDB Default)
                </text>
                <text x="410" y="23" fill={btreeCyan} fontSize="10" fontFamily="monospace" fontWeight="bold">
                  O(log_B N + K)
                </text>

                {/* Level 0: Root Page (Page 1) */}
                <g
                  transform="translate(190, 52)"
                  filter={currentTime >= 3.0 && currentTime < 6.0 ? 'url(#glow-cyan)' : undefined}
                >
                  <rect
                    x="0"
                    y="0"
                    width="120"
                    height="42"
                    rx="6"
                    fill={isLight ? '#f0fdf4' : '#064e3b'}
                    stroke={btreeCyan}
                    strokeWidth={currentTime >= 3.0 && currentTime < 6.0 ? 2.5 : 1.5}
                  />
                  <text x="60" y="16" textAnchor="middle" fill={textPrimary} fontSize="9" fontWeight="bold">
                    ROOT: PAGE 1 (8 KiB)
                  </text>
                  <text x="60" y="32" textAnchor="middle" fill={btreeCyan} fontSize="11" fontFamily="monospace" fontWeight="bold">
                    [ 20 | 50 ]
                  </text>
                </g>

                {/* Tree Branches (Root to Internal) */}
                <path
                  d="M 220 94 L 140 130"
                  stroke={btreeCyan}
                  strokeWidth={currentTime >= 3.0 ? 2 : 1}
                  strokeDasharray={currentTime >= 3.0 ? 'none' : '3 3'}
                  opacity={currentTime >= 3.0 ? 1 : 0.5}
                />
                <path
                  d="M 280 94 L 360 130"
                  stroke={btreeCyan}
                  strokeWidth={currentTime >= 3.0 ? 2 : 1}
                  strokeDasharray={currentTime >= 3.0 ? 'none' : '3 3'}
                  opacity={currentTime >= 3.0 ? 1 : 0.5}
                />

                {/* Level 1: Internal Routing Pages */}
                {/* Internal Page 2 */}
                <g transform="translate(70, 130)">
                  <rect
                    x="0"
                    y="0"
                    width="130"
                    height="42"
                    rx="6"
                    fill={isLight ? '#f8fafc' : '#0f172a'}
                    stroke={cardBorder}
                    strokeWidth="1.5"
                  />
                  <text x="65" y="16" textAnchor="middle" fill={textSecondary} fontSize="8" fontWeight="bold">
                    INTERNAL: PAGE 2
                  </text>
                  <text x="65" y="32" textAnchor="middle" fill={textPrimary} fontSize="10" fontFamily="monospace">
                    [ &lt; 10 | 15 ]
                  </text>
                </g>

                {/* Internal Page 3 */}
                <g
                  transform="translate(300, 130)"
                  filter={currentTime >= 3.5 && currentTime < 6.5 ? 'url(#glow-cyan)' : undefined}
                >
                  <rect
                    x="0"
                    y="0"
                    width="130"
                    height="42"
                    rx="6"
                    fill={isLight ? '#f0fdf4' : '#064e3b'}
                    stroke={btreeCyan}
                    strokeWidth={currentTime >= 3.5 && currentTime < 6.5 ? 2.5 : 1.5}
                  />
                  <text x="65" y="16" textAnchor="middle" fill={textPrimary} fontSize="8" fontWeight="bold">
                    INTERNAL: PAGE 3
                  </text>
                  <text x="65" y="32" textAnchor="middle" fill={btreeCyan} fontSize="10" fontFamily="monospace" fontWeight="bold">
                    [ 30 | 40 ]
                  </text>
                </g>

                {/* Tree Branches (Internal to Leaves) */}
                <path d="M 105 172 L 65 210" stroke={btreeCyan} strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
                <path d="M 165 172 L 180 210" stroke={btreeCyan} strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
                <path
                  d="M 335 172 L 195 210"
                  stroke={btreeCyan}
                  strokeWidth={currentTime >= 4.5 ? 2 : 1}
                  opacity={currentTime >= 4.5 ? 1 : 0.4}
                />
                <path
                  d="M 365 172 L 310 210"
                  stroke={btreeCyan}
                  strokeWidth={currentTime >= 4.5 ? 2 : 1}
                  opacity={currentTime >= 4.5 ? 1 : 0.4}
                />
                <path d="M 405 172 L 430 210" stroke={btreeCyan} strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />

                {/* Level 2: Leaf Pages (Linked List of Disk Pages) */}
                {/* Leaf Page 4 */}
                <g transform="translate(15, 210)">
                  <rect x="0" y="0" width="100" height="54" rx="6" fill={isLight ? '#f8fafc' : '#0b0f19'} stroke={cardBorder} />
                  <text x="50" y="16" textAnchor="middle" fill={textSecondary} fontSize="8" fontWeight="bold">
                    LEAF: PAGE 4
                  </text>
                  <text x="50" y="34" textAnchor="middle" fill={textSecondary} fontSize="9" fontFamily="monospace">
                    [5, 10, 15]
                  </text>
                  <text x="50" y="47" textAnchor="middle" fill={textSecondary} fontSize="7">
                    ptr ⇄ Page 5
                  </text>
                </g>

                {/* Leaf Sibling Pointer 4 <-> 5 */}
                <path
                  d="M 115 237 L 135 237"
                  stroke={leafEmerald}
                  strokeWidth="2"
                  markerEnd="url(#arrow-emerald)"
                  markerStart="url(#arrow-emerald)"
                />

                {/* Leaf Page 5 (Matched Range Start: 20, 25) */}
                <g
                  transform="translate(140, 210)"
                  filter={currentTime >= 5.0 && currentTime < 8.0 ? 'url(#glow-cyan)' : undefined}
                >
                  <rect
                    x="0"
                    y="0"
                    width="105"
                    height="54"
                    rx="6"
                    fill={currentTime >= 5.0 ? (isLight ? '#dcfce7' : '#052e16') : isLight ? '#ffffff' : '#0f172a'}
                    stroke={currentTime >= 5.0 ? leafEmerald : cardBorder}
                    strokeWidth={currentTime >= 5.0 ? 2 : 1.5}
                  />
                  <text x="52" y="16" textAnchor="middle" fill={textPrimary} fontSize="8" fontWeight="bold">
                    LEAF: PAGE 5 ★
                  </text>
                  <text
                    x="52"
                    y="34"
                    textAnchor="middle"
                    fill={currentTime >= 5.0 ? leafEmerald : textPrimary}
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    [ 20, 25 ]
                  </text>
                  <text x="52" y="47" textAnchor="middle" fill={textSecondary} fontSize="7">
                    ⇄ prev / next
                  </text>
                </g>

                {/* Leaf Sibling Pointer 5 <-> 6 (THE HERO SIBLING POINTER LINK!) */}
                <g transform="translate(245, 230)">
                  <line
                    x1="2"
                    y1="7"
                    x2="28"
                    y2="7"
                    stroke={leafEmerald}
                    strokeWidth={strategyMode === 'range_query' && currentTime >= 6.5 ? 3.5 : 2}
                    markerEnd="url(#arrow-emerald)"
                    markerStart="url(#arrow-emerald)"
                  />
                  {strategyMode === 'range_query' && currentTime >= 6.5 && (
                    <circle
                      cx={5 + p3 * 20}
                      cy="7"
                      r="4"
                      fill={leafEmerald}
                      filter="url(#glow-cyan)"
                    />
                  )}
                  <text x="15" y="-3" textAnchor="middle" fill={leafEmerald} fontSize="7" fontWeight="bold">
                    SIBLING
                  </text>
                </g>

                {/* Leaf Page 6 (Matched Range End: 30, 35) */}
                <g
                  transform="translate(280, 210)"
                  filter={currentTime >= 7.0 && currentTime < 9.5 ? 'url(#glow-cyan)' : undefined}
                >
                  <rect
                    x="0"
                    y="0"
                    width="105"
                    height="54"
                    rx="6"
                    fill={currentTime >= 7.0 ? (isLight ? '#dcfce7' : '#052e16') : isLight ? '#ffffff' : '#0f172a'}
                    stroke={currentTime >= 7.0 ? leafEmerald : cardBorder}
                    strokeWidth={currentTime >= 7.0 ? 2 : 1.5}
                  />
                  <text x="52" y="16" textAnchor="middle" fill={textPrimary} fontSize="8" fontWeight="bold">
                    LEAF: PAGE 6 ★
                  </text>
                  <text
                    x="52"
                    y="34"
                    textAnchor="middle"
                    fill={currentTime >= 7.0 ? leafEmerald : textPrimary}
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    [ 30, 35 ]
                  </text>
                  <text x="52" y="47" textAnchor="middle" fill={textSecondary} fontSize="7">
                    ⇄ prev / next
                  </text>
                </g>

                {/* Leaf Sibling Pointer 6 <-> 7 */}
                <path
                  d="M 385 237 L 405 237"
                  stroke={leafEmerald}
                  strokeWidth="2"
                  markerEnd="url(#arrow-emerald)"
                  markerStart="url(#arrow-emerald)"
                />

                {/* Leaf Page 7 */}
                <g transform="translate(410, 210)">
                  <rect x="0" y="0" width="80" height="54" rx="6" fill={isLight ? '#f8fafc' : '#0b0f19'} stroke={cardBorder} />
                  <text x="40" y="16" textAnchor="middle" fill={textSecondary} fontSize="8" fontWeight="bold">
                    LEAF: PAGE 7
                  </text>
                  <text x="40" y="34" textAnchor="middle" fill={textSecondary} fontSize="9" fontFamily="monospace">
                    [ 50, 60 ]
                  </text>
                  <text x="40" y="47" textAnchor="middle" fill={textSecondary} fontSize="7">
                    ptr ⇄ Page 6
                  </text>
                </g>

                {/* Sequential Leaf Scan Banner */}
                <g transform="translate(20, 280)">
                  <rect
                    x="0"
                    y="0"
                    width="460"
                    height="75"
                    rx="8"
                    fill={isLight ? '#f0fdf4' : '#052e16'}
                    stroke={leafEmerald}
                    strokeWidth="1.5"
                  />
                  <text x="12" y="20" fill={leafEmerald} fontSize="10" fontWeight="bold">
                    ⚡ SEQUENTIAL SIBLING POINTER TRAVERSAL (No Backtracking to Root)
                  </text>
                  <text x="12" y="38" fill={textPrimary} fontSize="9" fontFamily="monospace">
                    1. Direct Tree Descent: Root [Page 1] → Internal [Page 3] → Leaf [Page 5] (3 I/O hops)
                  </text>
                  <text x="12" y="52" fill={leafEmerald} fontSize="9" fontFamily="monospace" fontWeight="bold">
                    2. Horizontal Sibling Hop: Page 5.next_page_id → Page 6 (1 sequential I/O hop)
                  </text>
                  <text x="12" y="66" fill={textSecondary} fontSize="8.5">
                    Result: 4 matched rows retrieved in only 4 page reads with sequential disk prefetch!
                  </text>
                </g>

                {/* EXPLAIN QUERY PLAN (B+ Tree) */}
                <g transform="translate(20, 370)">
                  <rect x="0" y="0" width="460" height="74" rx="8" fill={isLight ? '#0f172a' : '#020617'} stroke={cardBorder} />
                  <text x="12" y="18" fill="#38bdf8" fontSize="9" fontWeight="bold" fontFamily="monospace">
                    EXPLAIN QUERY PLAN (SQLite / PostgreSQL)
                  </text>
                  <text x="12" y="36" fill="#4ade80" fontSize="10" fontFamily="monospace">
                    {strategyMode === 'range_query'
                      ? '`--SEARCH employees USING INDEX idx_id (id BETWEEN ? AND ?)'
                      : strategyMode === 'point_query'
                      ? '`--SEARCH employees USING INDEX idx_id (id = ?)'
                      : '`--SEARCH employees USING INDEX idx_dept_salary (dept_id = ?)'}
                  </text>
                  <text x="12" y="52" fill="#94a3b8" fontSize="8.5" fontFamily="monospace">
                    Access Method: Index Range Seek (O(log N + K)) | Disk Reads: {btreeHops} | Active: {activeBTreePage}
                  </text>
                  <text x="12" y="66" fill="#38bdf8" fontSize="8" fontFamily="monospace">
                    Buffer Pool Status: Cache Hit (Sequential Pages Pre-warmed)
                  </text>
                </g>
              </g>

              {/* ========================================================= */}
              {/* RIGHT HALF: HASH INDEX & TABLE SCAN FALLBACK (x: 540-980) */}
              {/* ========================================================= */}
              <g transform="translate(540, 20)">
                <rect
                  x="0"
                  y="0"
                  width="440"
                  height="460"
                  rx="12"
                  fill={cardBg}
                  stroke={strategyMode === 'range_query' && currentTime >= 6.0 ? tableScanRed : cardBorder}
                  strokeWidth="1.5"
                  filter="url(#btree-shadow)"
                />

                {/* Header */}
                <rect x="0" y="0" width="440" height="38" rx="12" fill={isLight ? '#faf5ff' : '#2e1065'} />
                <path d="M 0 12 Q 0 0 12 0 L 428 0 Q 440 0 440 12 L 440 38 L 0 38 Z" fill={isLight ? '#faf5ff' : '#2e1065'} />
                <circle cx="20" cy="19" r="6" fill={hashPurple} />
                <text x="34" y="23" fill={textPrimary} fontSize="12" fontWeight="700">
                  HASH INDEX (In-Memory / Dynamic Hashing)
                </text>
                <text x="335" y="23" fill={hashPurple} fontSize="10" fontFamily="monospace" fontWeight="bold">
                  O(1) Point vs O(N) Range
                </text>

                {/* Hash Function Engine Box */}
                <g transform="translate(18, 50)">
                  <rect
                    x="0"
                    y="0"
                    width="404"
                    height="50"
                    rx="8"
                    fill={isLight ? '#f5f3ff' : '#1e1b4b'}
                    stroke={hashPurple}
                    strokeWidth="1.2"
                  />
                  <text x="12" y="18" fill={textPrimary} fontSize="9" fontWeight="bold">
                    HASH FUNCTION ENGINE: h(k) = (k * Murmur3) % 8
                  </text>
                  <text x="12" y="34" fill={hashPurple} fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                    {strategyMode === 'point_query'
                      ? 'Input: 42 → h(42) = 2 (Direct Single Hop to Bucket 2)'
                      : 'Input: [20, 25, 30, 35] → Scatters to Buckets [4, 1, 6, 3]'}
                  </text>
                  <text x="12" y="45" fill={textSecondary} fontSize="8">
                    Note: Hash function randomizes key order; completely destroys ordering between 20 &amp; 35!
                  </text>
                </g>

                {/* Hash Buckets Grid (8 Buckets) */}
                <g transform="translate(18, 110)">
                  <text x="0" y="10" fill={textSecondary} fontSize="9" fontWeight="bold">
                    HASH BUCKET ARRAY (In-Memory Pointers)
                  </text>
                  <g transform="translate(0, 18)">
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((b, idx) => {
                      const isPointHit = strategyMode === 'point_query' && b === 2 && currentTime >= 4.0
                      const isRangeHit =
                        strategyMode === 'range_query' && [1, 3, 4, 6].includes(b) && currentTime >= 4.0
                      const bg = isPointHit
                        ? '#10b981'
                        : isRangeHit
                        ? '#ef4444'
                        : isLight
                        ? '#f1f5f9'
                        : '#1e293b'
                      return (
                        <g key={b} transform={`translate(${idx * 51}, 0)`}>
                          <rect
                            x="0"
                            y="0"
                            width="46"
                            height="44"
                            rx="5"
                            fill={bg}
                            stroke={isPointHit ? '#059669' : isRangeHit ? '#dc2626' : cardBorder}
                            strokeWidth={isPointHit || isRangeHit ? 2 : 1}
                          />
                          <text
                            x="23"
                            y="16"
                            textAnchor="middle"
                            fill={isPointHit || isRangeHit ? '#ffffff' : textSecondary}
                            fontSize="8"
                            fontWeight="bold"
                          >
                            B_{b}
                          </text>
                          <text
                            x="23"
                            y="32"
                            textAnchor="middle"
                            fill={isPointHit || isRangeHit ? '#ffffff' : textPrimary}
                            fontSize="8"
                            fontFamily="monospace"
                          >
                            {b === 2 ? 'id:42' : b === 4 ? 'id:20' : b === 1 ? 'id:25' : b === 6 ? 'id:30' : b === 3 ? 'id:35' : 'null'}
                          </text>
                        </g>
                      )
                    })}
                  </g>
                </g>

                {/* The Crucial Divergence: Hash Range Breakdown vs Point Match */}
                <g transform="translate(18, 185)">
                  {strategyMode === 'range_query' ? (
                    <g>
                      <rect
                        x="0"
                        y="0"
                        width="404"
                        height="85"
                        rx="8"
                        fill={isLight ? '#fef2f2' : '#450a0a'}
                        stroke={tableScanRed}
                        strokeWidth="1.5"
                      />
                      <circle cx="20" cy="20" r="8" fill={tableScanRed} />
                      <text x="20" y="24" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
                        !
                      </text>
                      <text x="36" y="22" fill={tableScanRed} fontSize="11" fontWeight="bold">
                        HASH INDEX RANGE SCAN INFEASIBILITY
                      </text>
                      <text x="12" y="42" fill={textPrimary} fontSize="9" fontFamily="monospace">
                        Keys 20, 25, 30, 35 scatter to 4 unconnected memory buckets!
                      </text>
                      <text x="12" y="58" fill={textPrimary} fontSize="9" fontFamily="monospace">
                        Cannot perform sequential pointer hops (no sibling links).
                      </text>
                      <text x="12" y="74" fill={tableScanRed} fontSize="9.5" fontWeight="bold" fontFamily="monospace">
                        → Query Planner Abandons Index: Fallback to FULL TABLE SCAN!
                      </text>
                    </g>
                  ) : (
                    <g>
                      <rect
                        x="0"
                        y="0"
                        width="404"
                        height="85"
                        rx="8"
                        fill={isLight ? '#f0fdf4' : '#052e16'}
                        stroke={leafEmerald}
                        strokeWidth="1.5"
                      />
                      <circle cx="20" cy="20" r="8" fill={leafEmerald} />
                      <text x="20" y="24" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
                        ✓
                      </text>
                      <text x="36" y="22" fill={leafEmerald} fontSize="11" fontWeight="bold">
                        HASH INDEX POINT LOOKUP EFFICIENCY
                      </text>
                      <text x="12" y="42" fill={textPrimary} fontSize="9" fontFamily="monospace">
                        Single mathematical hash calculation: h(42) = 2.
                      </text>
                      <text x="12" y="58" fill={textPrimary} fontSize="9" fontFamily="monospace">
                        Direct pointer dereference to Bucket 2 in 1 I/O hop.
                      </text>
                      <text x="12" y="74" fill={leafEmerald} fontSize="9.5" fontWeight="bold" fontFamily="monospace">
                        → O(1) Speed: Outperforms B+ Tree (1 I/O vs 3 I/Os).
                      </text>
                    </g>
                  )}
                </g>

                {/* Table Storage on Disk (Full Table Scan Simulation) */}
                <g transform="translate(18, 280)">
                  <rect
                    x="0"
                    y="0"
                    width="404"
                    height="75"
                    rx="8"
                    fill={
                      strategyMode === 'range_query' && currentTime >= 6.0
                        ? isLight
                          ? '#fee2e2'
                          : '#7f1d1d'
                        : isLight
                        ? '#f8fafc'
                        : '#0b0f19'
                    }
                    stroke={
                      strategyMode === 'range_query' && currentTime >= 6.0
                        ? tableScanRed
                        : cardBorder
                    }
                    strokeWidth="1.5"
                  />
                  <text
                    x="12"
                    y="18"
                    fill={
                      strategyMode === 'range_query' && currentTime >= 6.0
                        ? tableScanRed
                        : textSecondary
                    }
                    fontSize="9.5"
                    fontWeight="bold"
                  >
                    RAW DISK STORAGE (Heap Pages / Table Block Scan)
                  </text>
                  <g transform="translate(12, 28)">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <rect
                        key={i}
                        x={i * 31}
                        y="0"
                        width="27"
                        height="20"
                        rx="3"
                        fill={
                          strategyMode === 'range_query' && currentTime >= 6.0
                            ? tableScanRed
                            : isLight
                            ? '#e2e8f0'
                            : '#1e293b'
                        }
                        opacity={
                          strategyMode === 'range_query' && currentTime >= 6.0
                            ? 0.3 + ((i + currentTime * 4) % 10) * 0.07
                            : 0.6
                        }
                      />
                    ))}
                  </g>
                  <text x="12" y="66" fill={textSecondary} fontSize="8" fontFamily="monospace">
                    {strategyMode === 'range_query' && currentTime >= 6.0
                      ? '⚠️ SCANNING ALL 1,000 DISK BLOCKS SEQUENTIALLY (O(N) Penalty)'
                      : 'Physical Disk Blocks: Unread during point lookup'}
                  </text>
                </g>

                {/* EXPLAIN QUERY PLAN (Hash / Table Scan Fallback) */}
                <g transform="translate(18, 370)">
                  <rect x="0" y="0" width="404" height="74" rx="8" fill={isLight ? '#0f172a' : '#020617'} stroke={cardBorder} />
                  <text x="12" y="18" fill="#c084fc" fontSize="9" fontWeight="bold" fontFamily="monospace">
                    EXPLAIN QUERY PLAN (Execution Path)
                  </text>
                  <text
                    x="12"
                    y="36"
                    fill={strategyMode === 'point_query' ? '#4ade80' : '#f87171'}
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {strategyMode === 'point_query'
                      ? '`--SEARCH employees USING HASH (id = ?)'
                      : '`--SCAN TABLE employees (Seq Scan: 1000 Pages)'}
                  </text>
                  <text x="12" y="52" fill="#94a3b8" fontSize="8.5" fontFamily="monospace">
                    Cost: {hashHops} Page I/Os | Strategy: {optimizerPath}
                  </text>
                  <text
                    x="12"
                    y="66"
                    fill={strategyMode === 'point_query' ? '#38bdf8' : '#f87171'}
                    fontSize="8"
                    fontFamily="monospace"
                  >
                    Target: {activeHashBucket} | {strategyMode === 'point_query' ? 'Optimal O(1)' : 'Hash Range Failure'}
                  </text>
                </g>
              </g>

              {/* Traversal telemetry banner between panels */}
              <g transform="translate(480, 240)">
                <circle cx="20" cy="20" r="14" fill={isLight ? '#ffffff' : '#0f172a'} stroke={amberWarning} strokeWidth="2" />
                <text x="20" y="24" textAnchor="middle" fill={amberWarning} fontSize="10" fontWeight="bold">
                  VS
                </text>
              </g>
            </svg>
          )
        }}
      </MotionGraphicPlayer>
    </div>
  )
}
