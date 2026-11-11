/** Interactive Obsidian & Cyber Emerald engineering schematics for each track. */
export default function SubjectArtwork({ subject }: { subject: string }) {
  let drawing

  switch (subject) {
    case 'dsa':
      drawing = (
        <g>
          <circle cx="104" cy="64" r="70" fill="url(#art-mint-glow)" stroke="none" />
          {/* Pointer tag that glides across cells on hover */}
          <g className="art-dsa-pointer">
            <rect x="64" y="16" width="38" height="18" rx="4" fill="#00F59B" fillOpacity="0.14" stroke="#00F59B" strokeWidth="1.2" />
            <text x="83" y="29" textAnchor="middle" fill="#00F59B" stroke="none" fontSize="10" fontWeight="600">
              i=0
            </text>
          </g>

          {/* Array [2, 7, 11, 15] */}
          {[
            { x: 52, val: '2', idx: '[0]', match: true },
            { x: 108, val: '7', idx: '[1]', match: true },
            { x: 164, val: '11', idx: '[2]', match: false },
            { x: 220, val: '15', idx: '[3]', match: false },
          ].map((cell) => (
            <g key={cell.idx}>
              <rect
                x={cell.x}
                y="42"
                width="48"
                height="44"
                rx="6"
                fill="#111413"
                stroke={cell.match ? '#00F59B' : '#252C28'}
                strokeWidth={cell.match ? '1.4' : '1.2'}
                className={cell.match ? 'art-emerald-border' : undefined}
              />
              <text x={cell.x + 24} y="66" textAnchor="middle" fill="#F9FAFB" stroke="none" fontSize="14" fontWeight="600">
                {cell.val}
              </text>
              <text x={cell.x + 24} y="100" textAnchor="middle" fill="#838B97" stroke="none" fontSize="10">
                {cell.idx}
              </text>
            </g>
          ))}

          {/* Pair link curve & target pill */}
          <path d="M76 106 C76 126, 132 126, 132 106" stroke="#00F59B" strokeWidth="1.7" className="art-reveal-bright" />
          <rect x="172" y="112" width="96" height="22" rx="4" fill="#111413" stroke="#252C28" />
          <text x="220" y="127" textAnchor="middle" fill="#00F59B" stroke="none" fontSize="10" fontWeight="600">
            2 + 7 = 9
          </text>
        </g>
      )
      break

    case 'system_design':
      drawing = (
        <g>
          <circle cx="166" cy="48" r="76" fill="url(#art-mint-glow)" stroke="none" />
          {/* Distinct HLD Edge -> Cache HIT -> DB Shard flow */}
          <rect x="20" y="54" width="70" height="38" rx="6" fill="#111413" stroke="#38BDF8" strokeWidth="1.3" />
          <text x="55" y="77" textAnchor="middle" fill="#F9FAFB" stroke="none" fontSize="10" fontWeight="600">
            Edge LB
          </text>

          <rect x="128" y="24" width="76" height="36" rx="6" fill="#111413" stroke="#00F59B" strokeWidth="1.4" />
          <text x="166" y="46" textAnchor="middle" fill="#00F59B" stroke="none" fontSize="10" fontWeight="600">
            Cache HIT
          </text>

          <rect x="128" y="88" width="76" height="36" rx="6" fill="#111413" stroke="#252C28" strokeWidth="1.2" />
          <text x="166" y="110" textAnchor="middle" fill="#9CA3AF" stroke="none" fontSize="10">
            Shard 01
          </text>

          <rect x="234" y="54" width="66" height="38" rx="6" fill="#111413" stroke="#252C28" strokeWidth="1.2" />
          <text x="267" y="77" textAnchor="middle" fill="#F9FAFB" stroke="none" fontSize="10" fontWeight="600">
            200 OK
          </text>

          {/* Fast cache path vs cold fallback */}
          <path d="M90 66 C108 66, 108 42, 128 42" stroke="#00F59B" strokeWidth="1.7" />
          <path d="M204 42 C220 42, 220 66, 234 66" stroke="#00F59B" strokeWidth="1.7" />
          <path d="M90 80 C108 80, 108 106, 128 106" stroke="#252C28" strokeDasharray="3 4" strokeWidth="1.2" />

          {/* Packet traveling along cache bypass on hover */}
          <circle cx="109" cy="54" r="4" fill="#00F59B" stroke="none" className="art-sd-packet" />
        </g>
      )
      break

    case 'python_data':
      drawing = (
        <g>
          <circle cx="218" cy="70" r="76" fill="url(#art-sky-glow)" stroke="none" />
          {/* Stack Frame Ref -> Heap List Slice */}
          <rect x="24" y="28" width="84" height="38" rx="6" fill="#111413" stroke="#38BDF8" strokeWidth="1.3" />
          <text x="66" y="51" textAnchor="middle" fill="#F9FAFB" stroke="none" fontSize="10" fontWeight="600">
            df_slice
          </text>

          <path d="M108 47 C138 47, 138 56, 168 56" stroke="#38BDF8" strokeWidth="1.6" />
          <circle cx="168" cy="56" r="3" fill="#38BDF8" stroke="none" />

          <rect x="174" y="24" width="122" height="98" rx="8" fill="#111413" stroke="#252C28" strokeWidth="1.3" />
          <path d="M174 56h122 M174 88h122" stroke="#252C28" strokeWidth="1" />

          {/* Highlighted row on hover */}
          <rect x="178" y="60" width="114" height="24" rx="4" fill="#00F59B" fillOpacity="0.14" stroke="none" className="art-reveal-bright" />

          <text x="190" y="44" fill="#838B97" stroke="none" fontSize="10">[0]</text>
          <text x="248" y="44" fill="#F9FAFB" stroke="none" fontSize="10" fontWeight="600">24.0</text>
          <text x="190" y="76" fill="#38BDF8" stroke="none" fontSize="10" fontWeight="600">[1]</text>
          <text x="248" y="76" fill="#00F59B" stroke="none" fontSize="10" fontWeight="600">42.5</text>
          <text x="190" y="108" fill="#838B97" stroke="none" fontSize="10">[2]</text>
          <text x="248" y="108" fill="#9CA3AF" stroke="none" fontSize="10">18.2</text>

          <rect x="24" y="84" width="96" height="32" rx="6" fill="#111413" stroke="#252C28" />
          <text x="72" y="104" textAnchor="middle" fill="#00F59B" stroke="none" fontSize="10">
            heap ref *
          </text>
        </g>
      )
      break

    case 'sql_dbms':
      drawing = (
        <g>
          <circle cx="226" cy="72" r="76" fill="url(#art-mint-glow)" stroke="none" />
          {/* Index Key Scan -> Matching Row Highlight */}
          <rect x="22" y="28" width="96" height="92" rx="6" fill="#111413" stroke="#252C28" strokeWidth="1.2" />
          <path d="M22 54h96 M22 80h96" stroke="#252C28" strokeWidth="1" />
          <text x="34" y="45" fill="#38BDF8" stroke="none" fontSize="10" fontWeight="600">idx_users</text>
          <text x="34" y="71" fill="#F9FAFB" stroke="none" fontSize="10">id = 42</text>
          <text x="34" y="101" fill="#838B97" stroke="none" fontSize="10">O(log n)</text>

          <path d="M118 67 C146 67, 148 77, 178 77" stroke="#00F59B" strokeWidth="1.7" />
          <circle cx="178" cy="77" r="3" fill="#00F59B" stroke="none" />

          <rect x="182" y="28" width="116" height="92" rx="6" fill="#111413" stroke="#252C28" strokeWidth="1.2" />
          <path d="M182 54h116 M182 88h116" stroke="#252C28" strokeWidth="1" />
          <rect x="186" y="58" width="108" height="26" rx="4" fill="#00F59B" fillOpacity="0.14" stroke="#00F59B" strokeOpacity="0.5" className="art-reveal-bright" />
          <text x="194" y="45" fill="#838B97" stroke="none" fontSize="10">orders</text>
          <text x="194" y="75" fill="#00F59B" stroke="none" fontSize="10" fontWeight="600">uid:42 · HIT</text>
          <text x="194" y="106" fill="#838B97" stroke="none" fontSize="10">uid:43 · skip</text>
        </g>
      )
      break

    case 'os_concurrency':
      drawing = (
        <g>
          <circle cx="220" cy="72" r="76" fill="url(#art-mint-glow)" stroke="none" />
          {/* Thread lanes & Mutex barrier */}
          <text x="26" y="48" fill="#9CA3AF" stroke="none" fontSize="10" fontWeight="600">T1</text>
          <rect x="52" y="34" width="144" height="22" rx="4" fill="#111413" stroke="#252C28" />
          <rect x="56" y="38" width="88" height="14" rx="3" fill="#38BDF8" fillOpacity="0.28" stroke="#38BDF8" strokeWidth="1" />

          <text x="26" y="96" fill="#9CA3AF" stroke="none" fontSize="10" fontWeight="600">T2</text>
          <rect x="52" y="82" width="144" height="22" rx="4" fill="#111413" stroke="#252C28" />
          <rect x="56" y="86" width="44" height="14" rx="3" fill="#00F59B" fillOpacity="0.24" stroke="#00F59B" strokeWidth="1" className="art-os-thread" />

          {/* Mutex Lock Gate */}
          <line x1="208" y1="22" x2="208" y2="122" stroke="#00F59B" strokeDasharray="3 4" strokeWidth="1.6" />
          <rect x="220" y="54" width="76" height="36" rx="6" fill="#111413" stroke="#00F59B" strokeWidth="1.3" />
          <text x="258" y="76" textAnchor="middle" fill="#00F59B" stroke="none" fontSize="10" fontWeight="600">
            mutex
          </text>
        </g>
      )
      break

    case 'backend_apis':
      drawing = (
        <g>
          <circle cx="160" cy="73" r="82" fill="url(#art-mint-glow)" stroke="none" />
          {/* FastAPI Middleware Pipeline */}
          <rect x="20" y="54" width="76" height="38" rx="6" fill="#111413" stroke="#38BDF8" strokeWidth="1.3" />
          <text x="58" y="77" textAnchor="middle" fill="#F9FAFB" stroke="none" fontSize="10" fontWeight="600">
            POST /auth
          </text>

          <line x1="96" y1="73" x2="126" y2="73" stroke="#252C28" strokeWidth="2" />
          <rect x="126" y="54" width="70" height="38" rx="6" fill="#111413" stroke="#252C28" strokeWidth="1.2" />
          <text x="161" y="77" textAnchor="middle" fill="#38BDF8" stroke="none" fontSize="10" fontWeight="600">
            JWT
          </text>

          <line x1="196" y1="73" x2="226" y2="73" stroke="#252C28" strokeWidth="2" />
          <rect x="226" y="54" width="74" height="38" rx="6" fill="#111413" stroke="#00F59B" strokeWidth="1.3" />
          <text x="263" y="77" textAnchor="middle" fill="#00F59B" stroke="none" fontSize="10" fontWeight="600">
            200 OK
          </text>

          <circle cx="110" cy="73" r="4" fill="#00F59B" stroke="none" className="art-api-packet" />
        </g>
      )
      break

    case 'computer_networking':
      drawing = (
        <g>
          <circle cx="160" cy="74" r="80" fill="url(#art-sky-glow)" stroke="none" />
          {/* Distinct TCP 3-Way Handshake Sequence Ladder */}
          <rect x="34" y="16" width="64" height="22" rx="4" fill="#111413" stroke="#38BDF8" strokeWidth="1.2" />
          <text x="66" y="31" textAnchor="middle" fill="#F9FAFB" stroke="none" fontSize="10" fontWeight="600">Client</text>
          <line x1="66" y1="38" x2="66" y2="132" stroke="#252C28" strokeWidth="1.5" />

          <rect x="222" y="16" width="64" height="22" rx="4" fill="#111413" stroke="#38BDF8" strokeWidth="1.2" />
          <text x="254" y="31" textAnchor="middle" fill="#F9FAFB" stroke="none" fontSize="10" fontWeight="600">Server</text>
          <line x1="254" y1="38" x2="254" y2="132" stroke="#252C28" strokeWidth="1.5" />

          {/* SYN */}
          <path d="M68 50 L250 68" stroke="#38BDF8" strokeWidth="1.6" />
          <text x="160" y="52" textAnchor="middle" fill="#38BDF8" stroke="none" fontSize="10" fontWeight="600">SYN seq=0</text>

          {/* SYN-ACK */}
          <path d="M252 78 L70 96" stroke="#9CA3AF" strokeWidth="1.6" />
          <text x="160" y="83" textAnchor="middle" fill="#E5E7EB" stroke="none" fontSize="10" fontWeight="600">SYN-ACK</text>

          {/* ACK / TLS */}
          <path d="M68 106 L250 124" stroke="#00F59B" strokeWidth="1.7" className="art-reveal-bright" />
          <text x="160" y="128" textAnchor="middle" fill="#00F59B" stroke="none" fontSize="10" fontWeight="600">ACK · TLS 1.3</text>
          <circle cx="68" cy="106" r="3.5" fill="#00F59B" stroke="none" className="art-net-ack" />
        </g>
      )
      break

    case 'ai_resume':
    default:
      drawing = (
        <g>
          <circle cx="196" cy="52" r="78" fill="url(#art-mint-glow)" stroke="none" />
          {/* Vector Cosine Similarity & RAG Retrieval */}
          <rect x="22" y="54" width="68" height="38" rx="6" fill="#111413" stroke="#38BDF8" strokeWidth="1.4" />
          <text x="56" y="77" textAnchor="middle" fill="#38BDF8" stroke="none" fontSize="10" fontWeight="600">
            query
          </text>

          <path d="M90 66 L186 36" stroke="#00F59B" strokeWidth="1.7" className="art-reveal-bright" />
          <path d="M90 73 L186 73" stroke="#38BDF8" strokeWidth="1.2" strokeDasharray="3 3" />
          <path d="M90 80 L186 110" stroke="#252C28" strokeWidth="1.2" strokeDasharray="3 4" />

          <rect x="188" y="20" width="110" height="28" rx="5" fill="#111413" stroke="#00F59B" strokeWidth="1.4" />
          <text x="243" y="38" textAnchor="middle" fill="#00F59B" stroke="none" fontSize="10" fontWeight="600">
            cos 0.94 · hit
          </text>

          <rect x="188" y="59" width="110" height="28" rx="5" fill="#111413" stroke="#252C28" strokeWidth="1.2" />
          <text x="243" y="77" textAnchor="middle" fill="#9CA3AF" stroke="none" fontSize="10">
            cos 0.81
          </text>

          <rect x="188" y="98" width="110" height="28" rx="5" fill="#111413" stroke="#252C28" strokeWidth="1.2" />
          <text x="243" y="116" textAnchor="middle" fill="#838B97" stroke="none" fontSize="10">
            cos 0.32
          </text>
        </g>
      )
      break
  }

  return (
    <div className={`subject-art subject-art-${subject}`} data-zone="night" aria-hidden="true">
      <svg
        viewBox="0 0 320 148"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fontFamily="JetBrains Mono, monospace"
      >
        <defs>
          <radialGradient id="art-mint-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00F59B" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#00F59B" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="art-sky-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
          </radialGradient>
        </defs>
        {drawing}
      </svg>
    </div>
  )
}
