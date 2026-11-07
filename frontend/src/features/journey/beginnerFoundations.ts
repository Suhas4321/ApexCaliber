/** Bridge lessons for existing questions while foundation content moves into authored YAML. */
export interface BeginnerFoundation {
  goal: string
  plain_language: string
  terms?: { name: string; meaning: string }[]
  worked_example?: string
}

export const BEGINNER_FOUNDATIONS: Record<string, BeginnerFoundation> = {
  'processes-vs-threads-memory': {
    goal: 'First, meet the workers and the shared counter.',
    plain_language: 'A program is a set of instructions. When it runs, the operating system creates a process. A process can have more than one thread: each thread follows its own path through the instructions. Threads in the same process can access shared data. If two threads change that data at nearly the same time, the order of their actions matters.',
    terms: [
      { name: 'Process', meaning: 'A running program with its own execution environment and address space.' },
      { name: 'Thread', meaning: 'One path of execution inside a process. Threads in that process can share data.' },
      { name: 'Shared counter', meaning: 'A value both threads can read and change.' },
      { name: 'Lock', meaning: 'A rule that lets one thread enter a protected section at a time.' },
    ],
    worked_example: 'Start at `counter = 0`. Thread A reads `0`, then Thread B also reads `0`. Each computes `1` and writes it back. Two increments happened, yet the result is `1`. This is a **lost update**. A lock can make the read–change–write sequence happen for one thread at a time.',
  },
  'deadlock-cycle-detector': {
    goal: 'First, understand ownership and waiting.',
    plain_language: 'Imagine two workers and two tools. A worker must hold a tool before using it. If one worker has a tool, another worker can wait for it. Waiting is normal when the owner will finish and release it. A deadlock happens when the rules leave each worker waiting for an action that another waiting worker cannot perform.',
    terms: [
      { name: 'Resource', meaning: 'Something a task needs, such as a lock, row or file.' },
      { name: 'Owner', meaning: 'The task currently holding an exclusive resource.' },
      { name: 'Wait', meaning: 'A task cannot continue until a resource becomes available.' },
      { name: 'Circular wait', meaning: 'A chain of tasks in which each waits for another in the same chain.' },
    ],
    worked_example: 'Worker A holds tool 1 and asks for tool 2. Worker B holds tool 2 and asks for tool 1. If neither releases what it holds while waiting, neither can finish. Draw an arrow from each waiting worker to the worker holding the needed tool: the arrows form a cycle. The detector exercise later turns that idea into code.',
  },
  'asyncio-event-loop-semaphore': {
    goal: 'First, separate working from waiting.',
    plain_language: 'A program may spend time doing CPU work or waiting for something outside it, such as a network response. Async code can let one task pause at a suitable wait point so another ready task can run. This does not automatically make CPU work parallel. A semaphore limits how many tasks may enter a particular operation at once.',
    terms: [
      { name: 'Task', meaning: 'A unit of work the event loop can run or pause.' },
      { name: 'Await', meaning: 'A point where a task may yield while an operation is pending.' },
      { name: 'Event loop', meaning: 'The scheduler that runs ready async tasks on its thread.' },
      { name: 'Semaphore', meaning: 'A counter that permits only a chosen number of tasks through at once.' },
    ],
    worked_example: 'A service asks three remote APIs for data. While one request waits for a reply, the event loop can start another. If the remote service allows only two simultaneous requests, a semaphore with two permits makes the third task wait. A long CPU calculation would still occupy the event-loop thread unless moved elsewhere.',
  },
  'http-status-code-diagnostics': {
    goal: 'First, see one request and one response.',
    plain_language: 'When you open a page, your browser acts as a client: it asks a server for a resource. HTTP gives those messages a shared structure. A request says what action to take and which resource it concerns. A response says what happened and may include content. TCP can carry bytes for HTTP/1.1 and HTTP/2, but a byte stream by itself does not tell an application where each message begins and ends. HTTP/3 uses QUIC instead of TCP.',
    terms: [
      { name: 'Client', meaning: 'The program starting a request, such as your browser.' },
      { name: 'Server', meaning: 'The program receiving the request and sending a response.' },
      { name: 'Request', meaning: 'A message describing the desired action, path and relevant metadata.' },
      { name: 'Response', meaning: 'A message with a status and, often, a body.' },
    ],
    worked_example: 'Your browser sends `GET /guide` to a server. The server can reply `200 OK` with the guide, or `404 Not Found` if that path does not exist. The status belongs to the **response**. Later you will diagnose which part of a larger system produced each status.',
  },
  'tcp-three-way-handshake': {
    goal: 'First, learn what a TCP connection offers.',
    plain_language: 'Applications on different computers exchange data through the network. TCP gives an application a reliable, ordered stream of bytes between two endpoints. Before sending application data, the endpoints establish a connection and agree on starting sequence numbers. The three-way handshake is the opening conversation that does this.',
    terms: [
      { name: 'Endpoint', meaning: 'An IP address together with a port that identifies one side of a connection.' },
      { name: 'Byte stream', meaning: 'An ordered flow of bytes; application messages need their own boundaries.' },
      { name: 'SYN', meaning: 'A TCP control flag used to start connection establishment.' },
      { name: 'ACK', meaning: 'A TCP control flag indicating acknowledgment of received sequence information.' },
    ],
    worked_example: 'Think of a client checking whether a server is ready: the client sends SYN, the server answers SYN+ACK, and the client replies ACK. Both sides can then treat the connection as established. This is a model of the setup; real networks can lose or retry packets.',
  },
  'memory-isolation-threads-vs-processes': {
    goal: 'First, picture two workspaces.',
    plain_language: 'A process runs with its own address space. Another process normally cannot directly read its memory. Threads inside one process share that address space, so passing data between them is easier, but they must coordinate changes to shared values.',
    worked_example: 'Two browser tabs may run in separate processes: a crash in one is less likely to corrupt the other. Two threads in one image editor can work on the same document, but simultaneous edits need coordination. Isolation and sharing are different design choices.',
  },
  'python-gil-contention': {
    goal: 'First, tell CPU work from waiting.',
    plain_language: 'CPU work spends time calculating. I/O work often spends time waiting for a disk or network. In standard CPython, the global interpreter lock (GIL) generally lets only one thread execute Python bytecode at a time within one process. Threads can still help when one waits for I/O; multiple processes can run Python CPU work on different cores.',
    worked_example: 'If four requests are waiting for web responses, threads can overlap the waits. If four tasks each calculate a large checksum in pure Python, more threads in one CPython process may not use four CPU cores. A process pool may be a better fit for that workload.',
  },
  'context-switch-cost-model': {
    goal: 'First, see what the scheduler changes.',
    plain_language: 'A CPU core runs one thread at a time. The operating system can pause it and run another. To resume correctly later, it must preserve execution state. That switch takes time and can disturb cached data, so adding more runnable workers does not always make a program faster.',
    worked_example: 'One chef can alternate between chopping and stirring. If the chef switches after every cut, moving tools repeatedly wastes time. Computers switch much faster, but the trade-off is similar: enough switching keeps work responsive; excessive switching adds overhead.',
  },
  'single-flight-cache-lock': {
    goal: 'First, notice the crowded cache miss.',
    plain_language: 'A cache stores a result so later callers can reuse it. A cache miss means the result is absent. If many callers see the same miss simultaneously, they may all do the expensive work. Single-flight coordination lets one caller produce the result while the others wait for and share it.',
    worked_example: 'At 9:00, a popular product price expires from cache. One hundred requests arrive. Without coordination, all hundred may query the database. With a per-key lock, one request refreshes the price; the others use its result. Different product keys can still refresh independently.',
  },
  'thread-vs-process-pool-advisor': {
    goal: 'First, choose what kind of work you have.',
    plain_language: 'A pool keeps workers ready for repeated tasks. Threads in one process share memory and are useful when tasks spend much time waiting for I/O. Processes have separate memory and can use multiple CPU cores for Python calculations, but moving data between them costs time.',
    worked_example: 'Downloading twenty pages mostly waits on the network, so a thread pool can overlap those waits. Resizing twenty large images is CPU-heavy, so a process pool may help if each image is large enough to justify sending it to another process.',
  },
  'cors-preflight-evaluator': {
    goal: 'First, meet the browser’s origin rule.',
    plain_language: 'An origin combines a page’s scheme, host and port. Browsers restrict which other origins a page’s JavaScript can read. CORS is a way for a server to tell the browser which cross-origin reads it permits. For some requests, the browser asks permission first with a preflight OPTIONS request.',
    worked_example: 'A page at `shop.example` calls an API at `api.example`. Those are different origins. The browser may send OPTIONS first, then the real request if the API allows the origin, method and headers. CORS is enforced by the browser; it is not a replacement for authentication.',
  },
  'jwt-auth-role-guard': {
    goal: 'First, separate identity from permission.',
    plain_language: 'Authentication answers “who is making this request?” Authorization answers “may this person perform this action?” A signed token can carry identity and claims, but the server must verify its signature and validity before trusting them. A role check then decides whether the verified user can access a route.',
    worked_example: 'A student and a teacher both sign in. Each can prove identity with a valid token. Only the teacher may publish grades. The publish route must check the verified role on the server, even if the student’s screen hides the button.',
  },
  'async-job-queue-polling': {
    goal: 'First, distinguish a request from a long job.',
    plain_language: 'A normal HTTP request expects a response soon. If the work takes minutes, the server can accept the request, put a job in a queue and give the client a job ID. A worker processes the job separately, while the client checks its status later.',
    worked_example: 'A user uploads a video. The server responds with `202 Accepted` and a job ID instead of keeping the connection open during encoding. The app asks for the status until it is ready, then shows the finished video or a useful failure message.',
  },
  'idempotency-key-store': {
    goal: 'First, understand why requests repeat.',
    plain_language: 'A client may retry when a network timeout hides the server’s response. The original operation might already have succeeded. An idempotency key lets the server recognize a repeated request and return the earlier result instead of performing the side effect again.',
    worked_example: 'A customer taps Pay, but the response is lost. The app retries with the same key. The payment service finds the first result and returns it; it does not charge the customer twice. A new purchase needs a new key.',
  },
  'redis-sliding-window-rate-limiter': {
    goal: 'First, define the traffic limit.',
    plain_language: 'A rate limiter counts requests for a person, key or service over time. When the count exceeds a rule, the server can reject or delay more requests. A sliding window considers the recent interval continuously, so the boundary between fixed time buckets cannot grant an accidental burst.',
    worked_example: 'Suppose an API permits five requests in the last minute. A sixth request gets a limit response. As old requests become older than one minute, capacity returns. Redis can hold the recent timestamps when several servers share the same limit.',
  },
}
