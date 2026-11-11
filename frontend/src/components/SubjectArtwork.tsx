/** Small technical cover illustrations. Labels are illustrative, never learner progress. */
export default function SubjectArtwork({ subject }: { subject: string }) {
  const node = (x: number, y: number, text: string, width = 56) => <g key={`${x}-${y}`}><rect x={x} y={y} width={width} height="30" rx="6" fill="var(--surface-1)" stroke="currentColor" strokeOpacity=".4" /><text x={x + width / 2} y={y + 19} textAnchor="middle" fill="currentColor" stroke="none" fontSize="10">{text}</text></g>
  let drawing
  switch (subject) {
    case 'dsa':
      drawing = <><path d="M160 39 101 80M160 39l59 41M101 94l-38 35m38-35 37 35m81-35-37 35m37-35 38 35" /><g>{[[160,34,'8'],[101,85,'3'],[219,85,'12'],[63,135,'1'],[138,135,'6'],[182,135,'10'],[257,135,'14']].map(([x,y,n]) => <g key={n}><circle cx={x} cy={y} r="17" fill="var(--surface-1)" /><text x={x} y={Number(y)+4} textAnchor="middle" stroke="none" fill="currentColor" fontSize="11">{n}</text></g>)}</g></>
      break
    case 'python_data':
      drawing = <>{node(46,28,'values',72)}<path d="M118 43h38v36h22" /><rect x="177" y="58" width="95" height="95" rx="9" fill="var(--surface-1)" /><path d="M177 89h95m-95 31h95" /><text x="195" y="78" fontSize="11" fill="currentColor" stroke="none">[0]   24</text><text x="195" y="109" fontSize="11" fill="currentColor" stroke="none">[1]   42</text><text x="195" y="140" fontSize="11" fill="currentColor" stroke="none">[2]   18</text><text x="49" y="128" fontSize="24" fill="currentColor" stroke="none">{'{ }'}</text><path d="M93 127h39" strokeDasharray="3 4" /></>
      break
    case 'sql_dbms':
      drawing = <><rect x="34" y="35" width="112" height="104" rx="7" fill="var(--surface-1)" /><rect x="186" y="63" width="100" height="83" rx="7" fill="var(--surface-1)" /><path d="M34 62h112M34 88h112M34 114h112M80 62v77M186 90h100m-100 27h100m-40-42h40" /><circle cx="146" cy="75" r="4" fill="currentColor" /><text x="49" y="53" stroke="none" fill="currentColor" fontSize="10">users</text><text x="202" y="82" stroke="none" fill="currentColor" fontSize="10">orders</text><text x="49" y="80" stroke="none" fill="currentColor" fontSize="10">id</text><text x="49" y="107" stroke="none" fill="currentColor" fontSize="10">01</text><path d="M150 75h18v28h18" /></>
      break
    case 'os_concurrency':
      drawing = <><rect x="112" y="47" width="95" height="88" rx="12" fill="var(--surface-1)" /><rect x="129" y="64" width="61" height="54" rx="4" /><text x="159" y="97" textAnchor="middle" fontSize="12" fill="currentColor" stroke="none">CPU</text>{[65,83,101,119].map(y => <path key={y} d={`M92 ${y}h20m95 0h20`} />)}{[130,150,170,190].map(x => <path key={x} d={`M${x} 30v17m0 88v17`} />)}<path d="M44 48v95m230-95v95" strokeDasharray="3 5" /></>
      break
    case 'backend_apis':
      drawing = <>{node(27,68,'GET /',64)}{node(132,38,'API',65)}{node(132,109,'worker',65)}{node(238,68,'DB',55)}<path d="M91 83h22V53h19m-19 30v41h19m65-71h22v30h19m-41 41h22V83" /><circle cx="112" cy="83" r="4" fill="currentColor" /></>
      break
    case 'ai_resume':
      drawing = <><path d="M60 40 158 58 258 38M60 40l98 84 100-84M60 90l98-32 100 32M60 90l98 32 100-32M60 142l98-84 100 85M60 142l98-20 100 21" strokeOpacity=".35" />{[[60,40],[60,90],[60,142],[158,58],[158,122],[258,38],[258,90],[258,143]].map(([x,y],i) => <circle key={i} cx={x} cy={y} r="12" fill="var(--surface-1)" />)}</>
      break
    default:
      drawing = <>{node(125,20,'client',70)}{node(108,78,subject === 'system_design' ? 'load balancer' : 'router',104)}{node(32,137,'node A',70)}{node(218,137,'node B',70)}<path d="M160 50v28m0 30v14H67v15m93-15h93v15" /><circle cx="160" cy="122" r="4" fill="currentColor" /></>
  }
  return <div className={`subject-art subject-art-${subject}`} aria-hidden="true"><svg viewBox="0 0 320 185" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fontFamily="JetBrains Mono, monospace">{drawing}</svg></div>
}
