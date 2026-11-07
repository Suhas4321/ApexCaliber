import yaml
from pathlib import Path
from app.content_schema import QuestionContent

def inject_w41_tcp():
    path = Path('content/questions/41-tcp-handshake/tcp-three-way-handshake.yaml')
    data = yaml.safe_load(path.read_text())

    journey = [
        {
            'id': 'w41_s1_unreliable_channel',
            'title': 'The Unreliable Channel Paradox (UDP vs TCP)',
            'subtitle': 'Why streaming raw packets over an unreliable internet corrupts data',
            'scenario': 'The internet is a packet-switched network with no guaranteed delivery. Routers drop packets during buffer congestion, reroute them along different physical fiber lines, or duplicate them.',
            'mechanism': 'UDP simply fires packets into the dark without tracking order, losses, or duplicate delivery. TCP is a transport-layer abstraction that transforms an unreliable, disordered packet channel into a guaranteed, lossless, in-order byte stream.',
            'prediction': {
                'prompt': 'If a client streams payment instructions over raw UDP and 5% of packets are dropped by congested routers, what happens on the server?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Missing payload fragments, scrambled JSON, and failed deserialization because UDP provides zero retransmission.',
                        'explanation': 'Correct! UDP provides best-effort datagram delivery with zero recovery.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'The operating system kernel pauses and requests automatic retransmission.',
                        'explanation': 'Misconception! The OS kernel does not provide retransmission for UDP.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'The router automatically buffers the lost packet until bandwidth is available.',
                        'explanation': 'Incorrect! Congested routers drop packets into the bit bucket immediately.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'TCP sequence numbers and acknowledgments are essential for constructing reliable protocols over unreliable physical infrastructure.',
            },
            'controls': [
                {
                    'id': 'simulated_packet_loss_pct',
                    'label': 'Simulated Network Packet Loss (%)',
                    'type': 'slider',
                    'default': 10,
                    'min': 0,
                    'max': 50,
                    'step': 5,
                    'description': 'Adjust packet drop rate across virtual network hops',
                },
            ],
            'visualizer_type': 'network_flow',
            'visualizer_config': {'mode': 'tcp', 'title': 'UDP Stateless vs TCP Stream'},
        },
        {
            'id': 'w41_s2_two_army_2way_handshake',
            'title': 'The Two-Army Paradox & Why a 2-Way Handshake Fails',
            'subtitle': 'Why Client "Connect" + Server "OK" creates catastrophic phantom ghost connections',
            'scenario': 'Why does TCP require 3 steps? Why can\'t the client simply say "Connect" and the server say "OK"?',
            'mechanism': 'In distributed networks, packets can be delayed for seconds in routing buffers. If a client sends a "Connect" packet, crashes, reboots, and the delayed old packet arrives minutes later at the server, a 2-way handshake forces the server to allocate socket memory and worker threads for a dead connection (a Phantom Connection).',
            'prediction': {
                'prompt': 'In a 2-way handshake protocol, what happens when an old duplicate "Connect" packet from a crashed past session arrives at the server?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'The server opens a phantom connection, allocating memory and waiting indefinitely for data that will never arrive.',
                        'explanation': 'Correct! The server has no way to verify if the client is still alive without the 3rd step.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'The server immediately detects the client crashed by querying its CPU directly.',
                        'explanation': 'Impossible! In distributed systems, no global shared state or CPU probing exists.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'The router discards the packet because its timestamp is older than 5 seconds.',
                        'explanation': 'Incorrect! IP packets have TTL hop counts, not wall-clock timestamps.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'The 3rd handshake step (Client ACK) allows the client to reject delayed duplicate packets and proves the client is still alive.',
            },
            'controls': [
                {
                    'id': 'simulate_delayed_duplicate',
                    'label': 'Inject Delayed Duplicate Packet',
                    'type': 'toggle',
                    'default': True,
                    'description': 'Simulate an old SYN packet arriving after client crash',
                },
            ],
            'visualizer_type': 'network_flow',
            'visualizer_config': {'mode': 'tcp', 'title': 'Phantom Connection Vulnerability'},
        },
        {
            'id': 'w41_s3_3way_state_machine',
            'title': 'The 3-Way Handshake State Machine & ISN Synchronization',
            'subtitle': 'SYN ➔ SYN-ACK ➔ ACK: Synchronizing independent random sequence numbers',
            'scenario': 'Both sender and receiver must synchronize their independent byte counters (Initial Sequence Numbers) before transmitting application bytes.',
            'mechanism': 'Client picks client_isn (e.g. 1000) and sends SYN (CLOSED -> SYN_SENT). Server picks server_isn (e.g. 5000) and sends SYN-ACK with ack=1001 (LISTEN -> SYN_RCVD). Client sends ACK with ack=5001 and seq=1001 (SYN_SENT -> ESTABLISHED). Server verifies and enters ESTABLISHED.',
            'prediction': {
                'prompt': 'Why does a SYN packet consume 1 sequence number even though it carries 0 bytes of application payload?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Because the SYN flag is a state transition that must be reliably acknowledged by the peer.',
                        'explanation': 'Correct! Consuming 1 sequence number guarantees that the ACK explicitly confirms the SYN.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Because the TCP packet header itself is 1 byte in size.',
                        'explanation': 'Incorrect! Standard TCP headers are 20 to 60 bytes.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Sequence numbers only increment when payload bytes are transmitted.',
                        'explanation': 'Misconception! SYN and FIN flags both consume 1 logical sequence number.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Flags that change connection state (SYN and FIN) consume one sequence number so they can be reliably tracked and acknowledged.',
            },
            'controls': [
                {
                    'id': 'client_isn',
                    'label': 'Client Initial Sequence Number (ISN)',
                    'type': 'slider',
                    'default': 1000,
                    'min': 1000,
                    'max': 9000,
                    'step': 500,
                    'description': 'Random initial byte offset selected by client OS',
                },
                {
                    'id': 'server_isn',
                    'label': 'Server Initial Sequence Number (ISN)',
                    'type': 'slider',
                    'default': 5000,
                    'min': 1000,
                    'max': 9000,
                    'step': 500,
                    'description': 'Random initial byte offset selected by server OS',
                },
            ],
            'visualizer_type': 'network_flow',
            'visualizer_config': {'mode': 'tcp', 'title': 'TCP Sequence Number Arithmetic'},
        },
        {
            'id': 'w41_s4_packet_loss_rto',
            'title': 'Packet Loss & Retransmission Timeouts (RTO)',
            'subtitle': 'What happens when SYN-ACK or ACK drops in transit?',
            'scenario': 'What happens when an intermediate network hop drops the SYN-ACK or final ACK during handshake negotiation?',
            'mechanism': 'When client sends SYN, it starts a Retransmission Timer (RTO). If no SYN-ACK arrives within RTO, it retransmits with exponential backoff (1s, 2s, 4s). If final ACK drops, server retransmits SYN-ACK until client ACKs again.',
            'prediction': {
                'prompt': 'If the final ACK sent by the client is dropped by a router, what state is the server left in?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'The server remains in SYN_RCVD and retransmits its SYN-ACK until receiving an ACK or timing out.',
                        'explanation': 'Correct! The server does not transition to ESTABLISHED until the final ACK arrives.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'The server immediately closes the socket and returns to CLOSED state.',
                        'explanation': 'Incorrect! TCP is resilient and retransmits before aborting.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'The server enters ESTABLISHED immediately upon transmitting SYN-ACK.',
                        'explanation': 'Catastrophic misconception! That would reintroduce the 2-way handshake flaw.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'The server waits for the client to prove two-way reachability before transitioning to ESTABLISHED.',
            },
            'controls': [
                {
                    'id': 'drop_packet_step',
                    'label': 'Inject Packet Loss Chaos',
                    'type': 'select',
                    'default': 'None',
                    'options': ['None', 'DROP_SYN', 'DROP_SYN_ACK', 'DROP_ACK'],
                    'description': 'Drop specific packet during handshake flow',
                },
            ],
            'visualizer_type': 'network_flow',
            'visualizer_config': {'mode': 'tcp', 'title': 'Handshake Retransmission & Drops'},
        },
        {
            'id': 'w41_s5_syn_flood_cookies',
            'title': 'The SYN Flood Attack & Linux SYN Cookies Defense',
            'subtitle': 'How 500k spoofed SYNs exhaust server memory and how cryptographic cookies save the kernel',
            'scenario': 'An attacker sends millions of SYN packets with spoofed source IPs and never sends the final ACK. The server SYN backlog table fills up, dropping real users.',
            'mechanism': 'With SYN Cookies enabled (net.ipv4.tcp_syncookies = 1), the server does NOT allocate memory upon receiving a SYN. Instead, it encodes the connection parameters into the server_isn using a cryptographic hash. Only when a valid ACK arrives is socket memory allocated.',
            'prediction': {
                'prompt': 'How do SYN Cookies protect a server from memory exhaustion during a SYN Flood attack?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'The server defers socket memory allocation until the client proves its IP authenticity by returning the cryptographically signed ACK.',
                        'explanation': 'Correct! The server ISN encodes state statelessly without allocating a TCB.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'The server blocks all traffic originating from unknown IP addresses.',
                        'explanation': 'Incorrect! In a SYN flood, the attacker spoofs legitimate global IPs.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'The server switches the protocol from TCP to UDP automatically.',
                        'explanation': 'Incorrect! TCP cannot unilaterally downgrade to UDP.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'SYN Cookies are one of the most elegant mathematical defenses in operating systems, turning connection state into a stateless cryptographic puzzle.',
            },
            'controls': [
                {
                    'id': 'enable_syn_cookies',
                    'label': 'Enable Linux SYN Cookies (tcp_syncookies=1)',
                    'type': 'toggle',
                    'default': True,
                    'description': 'Encode connection state statelessly in sequence numbers',
                },
            ],
            'visualizer_type': 'network_flow',
            'visualizer_config': {'mode': 'tcp', 'title': 'SYN Flood & Cryptographic Cookie Defense'},
        },
        {
            'id': 'w41_s6_transfer_challenge',
            'title': 'Transfer Challenge: TCP 3-Way Handshake Connection State Machine',
            'subtitle': 'Implement the connection transitions and packet loss handling in Python',
            'scenario': 'Build the TCP connection simulator: manage states (CLOSED -> SYN_SENT -> ESTABLISHED), process SYN and SYN-ACK packets, compute sequence numbers, and handle dropped packet events.',
            'mechanism': 'The state machine validates transitions, constructs packet payloads with sequence arithmetic, and handles DROP flags cleanly.',
            'prediction': {
                'prompt': 'When client_isn = 1000 and server_isn = 5000, what are the exact ack and seq numbers on the final ACK packet?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'seq = 1001, ack = 5001.',
                        'explanation': 'Correct! seq = client_isn + 1 and ack = server_isn + 1.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'seq = 1000, ack = 5000.',
                        'explanation': 'Incorrect! Initial sequence numbers must be incremented by 1.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'seq = 0, ack = 0.',
                        'explanation': 'Incorrect! Sequence synchronization cannot use null offsets.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Sequence number agreement guarantees full-duplex communication ready for TLS and HTTP.',
            },
            'controls': [
                {
                    'id': 'test_isn_offset',
                    'label': 'ISN Offset Test Vector',
                    'type': 'slider',
                    'default': 2000,
                    'min': 1000,
                    'max': 8000,
                    'step': 1000,
                    'description': 'Test sequence number calculations against edge cases',
                },
            ],
            'visualizer_type': 'network_flow',
            'visualizer_config': {'mode': 'tcp', 'title': 'TCP State Machine Runner'},
            'lab_starter_code': '''class Solution:
    def simulate_tcp_handshake(self, client_isn: int, server_isn: int, packet_events: list[str]) -> dict:
        # Implement TCP 3-Way Handshake Connection State Machine
        pass
''',
            'lab_solution': '''class Solution:
    def simulate_tcp_handshake(self, client_isn: int, server_isn: int, packet_events: list[str]) -> dict:
        client_state = "CLOSED"
        server_state = "LISTEN"
        packets_transmitted = []

        # Step 1: Client sends SYN
        client_state = "SYN_SENT"
        packets_transmitted.append({"type": "SYN", "seq": client_isn, "ack": 0})

        if "DROP_SYN" in packet_events:
            return {
                "client_state": client_state,
                "server_state": server_state,
                "packets_transmitted": packets_transmitted,
                "connected": False,
            }

        # Step 2: Server sends SYN-ACK
        server_state = "SYN_RCVD"
        packets_transmitted.append({"type": "SYN-ACK", "seq": server_isn, "ack": client_isn + 1})

        if "DROP_SYN_ACK" in packet_events:
            return {
                "client_state": client_state,
                "server_state": server_state,
                "packets_transmitted": packets_transmitted,
                "connected": False,
            }

        # Step 3: Client sends ACK
        client_state = "ESTABLISHED"
        packets_transmitted.append({"type": "ACK", "seq": client_isn + 1, "ack": server_isn + 1})

        if "DROP_ACK" in packet_events:
            return {
                "client_state": client_state,
                "server_state": server_state,
                "packets_transmitted": packets_transmitted,
                "connected": False,
            }

        # Step 4: Server processes ACK
        server_state = "ESTABLISHED"

        return {
            "client_state": client_state,
            "server_state": server_state,
            "packets_transmitted": packets_transmitted,
            "connected": True,
        }
''',
        },
    ]

    data['journey'] = journey
    validated = QuestionContent.model_validate(data)
    with open(path, 'w') as f:
        yaml.dump(data, f, sort_keys=False, allow_unicode=True)
    print(f"World 41 validated and saved! ({len(validated.journey)} stages)")

inject_w41_tcp()
