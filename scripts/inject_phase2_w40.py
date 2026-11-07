import yaml
from pathlib import Path
from app.content_schema import QuestionContent

def inject_w40_dns():
    path = Path('content/questions/40-dns-resolution/dns-recursive-resolver.yaml')
    data = yaml.safe_load(path.read_text())

    journey = [
        {
            'id': 'w40_s1_hardcoded_ips',
            'title': 'The Distributed Phonebook & Why Hardcoded IPs Fail',
            'subtitle': 'Why modern autoscaling and blue-green deployments make hardcoded IPs fatal',
            'scenario': 'In modern cloud architectures, servers rotate IP addresses continuously during autoscaling, container restarts, and blue-green deployments. Hardcoding IP addresses in mobile apps or client SDKs causes fatal connection failures.',
            'mechanism': 'The Domain Name System (DNS) abstracts physical machine addresses behind logical domain names. When an IP changes, authoritative records update in one place, allowing millions of clients to discover the new address automatically.',
            'prediction': {
                'prompt': 'If an API gateway IP changes from 198.51.100.1 to 198.51.100.2, what happens to client apps configured with hardcoded IPs?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Clients immediately fail with Connection Refused or Network Unreachable because packets target a dead IP.',
                        'explanation': 'Correct! Network routers cannot discover application relocations without DNS.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'BGP routers automatically re-route the old IP packets to the new server IP.',
                        'explanation': 'Misconception! BGP routes IP blocks to autonomous systems, not individual container addresses.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'The client operating system detects the connection failure and queries DNS automatically.',
                        'explanation': 'Incorrect! If an IP was hardcoded in code, the OS network stack never receives a domain to query.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'DNS provides the critical indirection layer decoupling service identity from physical cloud network topology.',
            },
            'controls': [
                {
                    'id': 'ip_rotation_interval_sec',
                    'label': 'IP Rotation Frequency (sec)',
                    'type': 'slider',
                    'default': 60,
                    'min': 10,
                    'max': 300,
                    'step': 10,
                    'description': 'Simulate how frequently cloud containers rotate their network addresses',
                },
                {
                    'id': 'use_domain_names',
                    'label': 'Use DNS Domain Names',
                    'type': 'toggle',
                    'default': True,
                    'description': 'Route through DNS names instead of raw IP addresses',
                },
            ],
            'visualizer_type': 'network_flow',
            'visualizer_config': {'mode': 'dns', 'title': 'DNS Phonebook & IP Indirection'},
        },
        {
            'id': 'w40_s2_hierarchical_tree',
            'title': 'The 3-Tier Hierarchical Tree',
            'subtitle': 'Root (.) ➔ TLD (.com) ➔ Authoritative (netflix.com)',
            'scenario': 'The internet has billions of connected devices. No single server could answer every query without collapsing under petabytes of UDP queries.',
            'mechanism': 'DNS solves scalability through hierarchical delegation: 13 Root Server clusters know who manages Top-Level Domains (.com, .org, .net). TLD servers delegate to domain Authoritative Nameservers. The Authoritative Nameserver holds the actual resource records (A, AAAA, CNAME).',
            'prediction': {
                'prompt': 'Who is the ultimate authoritative source of truth for the IP address of api.netflix.com?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': "Netflix's authoritative nameservers (ns1.netflix.com) hosted on Route 53 or Cloudflare.",
                        'explanation': 'Correct! Authoritative nameservers contain the actual domain zone file.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'The global Root Nameserver cluster (a.root-servers.net).',
                        'explanation': 'Misconception! Root servers only point to TLD servers; they do not hold individual domain records.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'The local Wi-Fi router in the user\'s home.',
                        'explanation': 'Incorrect! The home router only forwards queries to upstream recursive resolvers.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Hierarchical delegation distributes DNS query load across independent global infrastructure tiers.',
            },
            'controls': [
                {
                    'id': 'hierarchy_depth',
                    'label': 'Nameserver Hierarchy Depth',
                    'type': 'slider',
                    'default': 4,
                    'min': 1,
                    'max': 4,
                    'step': 1,
                    'description': 'Inspect hops: 1=Client, 2=Resolver, 3=Root/TLD, 4=Authoritative',
                },
            ],
            'visualizer_type': 'network_flow',
            'visualizer_config': {'mode': 'dns', 'title': 'DNS Nameserver Hierarchy'},
        },
        {
            'id': 'w40_s3_recursive_vs_iterative',
            'title': 'Recursive Resolvers vs Iterative Traversal',
            'subtitle': 'Who does the legwork: your laptop or the recursive resolver?',
            'scenario': 'When you type a URL into a browser, your laptop does not query 4 different servers across the world. A recursive resolver does the work for you.',
            'mechanism': 'The client uses a simple Stub Resolver that issues a single Recursive Query ("give me the IP or fail") to an ISP or public resolver (8.8.8.8, 1.1.1.1). The recursive resolver performs multiple Iterative Queries ("where should I ask next?") down the hierarchy and caches the result.',
            'prediction': {
                'prompt': 'What is the key distinction between a recursive DNS query and an iterative query?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Recursive queries demand the final resolved IP; iterative queries return the best next referral hop.',
                        'explanation': 'Correct! Clients make recursive queries; resolvers execute iterative hops.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Recursive queries run over TCP; iterative queries run over UDP.',
                        'explanation': 'Misconception! Both typically use UDP port 53 unless response exceeds 512 bytes.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Iterative queries can be cached, while recursive queries cannot.',
                        'explanation': 'Incorrect! Resolvers cache all successful iterative responses.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Recursive resolvers shield user devices from complex network hops and keep global latency low through caching.',
            },
            'controls': [
                {
                    'id': 'dns_cache_enabled',
                    'label': 'Resolver In-Memory Cache Active',
                    'type': 'toggle',
                    'default': True,
                    'description': 'Enable recursive resolver TTL cache to eliminate redundant root queries',
                },
            ],
            'visualizer_type': 'network_flow',
            'visualizer_config': {'mode': 'dns', 'title': 'Recursive vs Iterative Flow'},
        },
        {
            'id': 'w40_s4_ttl_cutover_trap',
            'title': 'TTL Invalidation & The Blue-Green Cutover Trap',
            'subtitle': 'Why a 24-hour TTL can destroy a zero-downtime deployment',
            'scenario': 'A team cuts over to a new database cluster and shuts down the old one. But 40% of users keep hitting the dead servers for hours, causing an outage.',
            'mechanism': 'DNS records include a Time-To-Live (TTL) in seconds. Resolvers cache the record until TTL expires. If a record has TTL=86400 (24h), resolvers will not check for updates for a full day.',
            'prediction': {
                'prompt': 'What MUST an engineering team do 24 to 48 hours BEFORE a zero-downtime DNS cutover?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Lower the record TTL to 60 seconds beforehand so stale caches expire rapidly on migration day.',
                        'explanation': 'Correct! Pre-lowering TTL ensures fast global cache invalidation during cutover.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Restart the 13 global root DNS server clusters.',
                        'explanation': 'Impossible! Root servers are operated by independent global organizations (ICANN, NASA, Verisign).',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Send an HTTP 301 redirect to all mobile apps.',
                        'explanation': 'Ineffective! The client cannot connect to receive the redirect if DNS resolution fails.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Pre-lowering DNS TTL is a mandatory standard operating procedure for cloud infrastructure migrations.',
            },
            'controls': [
                {
                    'id': 'dns_ttl_sec',
                    'label': 'DNS Record TTL (seconds)',
                    'type': 'slider',
                    'default': 300,
                    'min': 60,
                    'max': 86400,
                    'step': 60,
                    'description': 'Adjust record caching duration to observe stale cache window',
                },
            ],
            'visualizer_type': 'network_flow',
            'visualizer_config': {'mode': 'dns', 'title': 'DNS TTL Cache Eviction'},
        },
        {
            'id': 'w40_s5_cache_poisoning_dnssec',
            'title': 'DNS Spoofing, Cache Poisoning & DNSSEC',
            'subtitle': 'How forged UDP packets hijack traffic and how cryptographic signatures stop it',
            'scenario': 'Because DNS runs over connectionless UDP, an attacker can flood a resolver with forged packets to redirect user traffic to a phishing site.',
            'mechanism': 'In Kaminsky cache poisoning, an attacker guesses the 16-bit Transaction ID and source port while a resolver waits for an authoritative response. DNSSEC stops this by signing resource records with public-key cryptography (RRSIG).',
            'prediction': {
                'prompt': 'Why does plain UDP make DNS vulnerable to cache poisoning if source ports and transaction IDs are predictable?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'UDP packets lack connection handshakes; anyone can forge the sender IP address and flood guessed transaction IDs.',
                        'explanation': 'Correct! Stateless UDP makes source IP spoofing trivial without cryptographic validation.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'UDP encrypts the payload so resolvers cannot inspect the domain name.',
                        'explanation': 'Incorrect! Standard UDP DNS is completely plaintext.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'DNS servers accept any packet that arrives on TCP port 443.',
                        'explanation': 'Incorrect! DNS operates on port 53.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'DNSSEC uses hierarchical cryptographic signatures to ensure record integrity even over unauthenticated UDP networks.',
            },
            'controls': [
                {
                    'id': 'enable_dnssec',
                    'label': 'Enable DNSSEC Cryptographic Verification',
                    'type': 'toggle',
                    'default': True,
                    'description': 'Verify digital signatures (RRSIG) on authoritative responses',
                },
            ],
            'visualizer_type': 'network_flow',
            'visualizer_config': {'mode': 'dns', 'title': 'DNSSEC Cryptographic Verification'},
        },
        {
            'id': 'w40_s6_transfer_challenge',
            'title': 'Transfer Challenge: In-Memory Recursive DNS Resolver with TTL Cache',
            'subtitle': 'Implement the authoritative caching state machine in Python',
            'scenario': 'Build the in-memory recursive resolver that caches domain records, shields the authoritative root zone, and computes real-time cache hit ratios.',
            'mechanism': 'The resolver checks local memory first. On a miss, it queries the authoritative root zone, stores the resolved IP in cache, and returns metrics.',
            'prediction': {
                'prompt': 'When processing 10,000 queries for 10 unique domains, what cache hit rate does an in-memory resolver achieve after the warm-up queries?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': '99.9% cache hit rate (only 10 root queries needed for 10,000 requests).',
                        'explanation': 'Correct! 10 initial root queries populate the cache; remaining 9,990 hit RAM directly.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': '50% cache hit rate due to UDP packet fragmentation.',
                        'explanation': 'Incorrect! In-memory caches do not drop internal lookups.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': '0% because each client requires independent authoritative confirmation.',
                        'explanation': 'Incorrect! Shared recursive resolvers serve all local clients from one cache.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Recursive DNS caching is what enables the internet to scale to billions of daily web requests.',
            },
            'controls': [
                {
                    'id': 'total_queries',
                    'label': 'Batch Query Volume',
                    'type': 'slider',
                    'default': 500,
                    'min': 50,
                    'max': 5000,
                    'step': 50,
                    'description': 'Run simulated query workload through resolver',
                },
            ],
            'visualizer_type': 'network_flow',
            'visualizer_config': {'mode': 'dns', 'title': 'Resolver Production Execution'},
            'lab_starter_code': '''class Solution:
    def simulate_dns_resolver(self, root_zone: dict[str, str], queries: list[str]) -> dict:
        # Implement Recursive DNS Resolver with TTL Caching
        pass
''',
            'lab_solution': '''class Solution:
    def simulate_dns_resolver(self, root_zone: dict[str, str], queries: list[str]) -> dict:
        resolver_cache = {}
        cache_hits = 0
        root_queries = 0
        resolved_ips = []
        for d in queries:
            if d in resolver_cache:
                cache_hits += 1
                resolved_ips.append(resolver_cache[d])
            else:
                root_queries += 1
                ip = root_zone.get(d)
                if ip is not None:
                    resolver_cache[d] = ip
                resolved_ips.append(ip)
        rate = round((cache_hits / len(queries) * 100), 2) if queries else 0.0
        return {
            "cache_hits": cache_hits,
            "root_queries": root_queries,
            "resolved_ips": resolved_ips,
            "cache_hit_rate": rate,
            "final_cache": resolver_cache,
        }
''',
        },
    ]

    data['journey'] = journey
    validated = QuestionContent.model_validate(data)
    with open(path, 'w') as f:
        yaml.dump(data, f, sort_keys=False, allow_unicode=True)
    print(f"World 40 validated and saved! ({len(validated.journey)} stages)")

inject_w40_dns()
