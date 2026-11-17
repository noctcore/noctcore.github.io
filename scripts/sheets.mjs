// The drawing set: one sheet per flow, each taken from the product's own
// banner spec (noctcore/.github brand/specs) or, for harness, its ledger. Every
// step name, stop and rule name below can be found in that repo's README or
// source.
export const sheets = [
  {
    id: 'family',
    tab: 'The family',
    subject: 'noctcore',
    mark: 'noctcore',
    form: 'passage',
    title: 'Every change still passes a gate.',
    lead: 'An agent diff on its way to your branch meets the family in order: lint rules in the editor and CI, repo checks in CI, then the verification gauntlet before the merge.',
    alt: 'An agent diff rises toward your branch through lint rules, repo checks and the gauntlet. Shell injection stops at the lint rules, a CI job that installs packages while it holds a secret stops at the repo checks, and a skipped test stops at the gauntlet.',
    diagram: {
      start: 'agent diff',
      end: 'your branch',
      gates: [
        { name: 'lint rules', stops: ['shell injection'] },
        { name: 'repo checks', stops: ['secret at install'] },
        { name: 'gauntlet', stops: ['skipped test'] },
      ],
    },
    detail: [
      ['lint rules', 'shell injection', '@noctcore/eslint-plugin-security', 'no-shell-interpolation', 'https://noctcore.github.io/eslint-plugins/packages/security/'],
      ['repo checks', 'secret at install', '@noctcore/harness/rules', 'github-actions-secret-no-install', 'https://noctcore.github.io/harness/'],
      ['gauntlet', 'skipped test', 'Nightcore guardrail battery', 'anti-gaming sweep', 'https://github.com/noctcore/nightcore#the-harness'],
    ],
  },
  {
    id: 'lint',
    tab: 'Lint rules',
    subject: 'noctcore/eslint-plugins',
    mark: 'eslint-plugins',
    form: 'passage',
    title: 'Catch bugs that compile.',
    lead: 'Source passes three of the fifteen plugin families on its way to a clean lint run. Each report points at the exact place.',
    alt: 'Source code passes the contracts, async-safety and security plugins on its way to a clean lint run. An unchecked fetch stops at contracts, a fetch with no timeout at async-safety, and shell interpolation at security.',
    diagram: {
      start: 'source',
      end: 'clean lint',
      gates: [
        { name: 'contracts', stops: ['unchecked fetch'] },
        { name: 'async-safety', stops: ['no timeout'] },
        { name: 'security', stops: ['shell interpolation'] },
      ],
    },
    detail: [
      ['contracts', 'unchecked fetch', '@noctcore/eslint-plugin-contracts', 'fetch-must-check-ok', 'https://noctcore.github.io/eslint-plugins/packages/contracts/'],
      ['async-safety', 'no timeout', '@noctcore/eslint-plugin-async-safety', 'require-fetch-timeout', 'https://noctcore.github.io/eslint-plugins/packages/async-safety/'],
      ['security', 'shell interpolation', '@noctcore/eslint-plugin-security', 'no-shell-interpolation', 'https://noctcore.github.io/eslint-plugins/packages/security/'],
    ],
  },
  {
    id: 'checks',
    tab: 'Repo checks',
    subject: 'noctcore/harness',
    mark: 'harness',
    form: 'ledger',
    title: 'Hold a repo to its own rules.',
    lead: 'One run of harness check. Every check runs, every command is printed, and a check that could not run is a failure, never a pass.',
    alt: 'One harness check run as a ledger: unit tests, a lockfile rule and actionlint at its pinned version pass; the secret-no-install rule fails on a job that reads a token and installs packages; zizmor is blocked with exit 2 because neither its pinned binary nor Docker is there. The run exits 1 and lists both stops.',
    rows: [
      { name: 'unit-tests', detail: 'node --test', verdict: 'passed' },
      { name: 'lockfile-registry-resolutions', detail: 'lint-meta, supply chain', verdict: 'passed' },
      { name: 'actionlint', detail: 'pinned, native binary', verdict: 'passed' },
      { name: 'github-actions-secret-no-install', detail: 'lint-meta, a job reads a token and installs', verdict: 'failed' },
      { name: 'zizmor', detail: 'no pinned binary, no Docker', verdict: 'blocked, exit 2' },
    ],
    detail: [
      ['lint-meta', 'secret at install', '@noctcore/harness/rules', 'github-actions-secret-no-install', 'https://noctcore.github.io/harness/'],
      ['pinned tools', 'missing pinned tool blocks the run', '@noctcore/harness/pinned-tools', 'zizmor, actionlint, gitleaks', 'https://noctcore.github.io/harness/'],
    ],
  },
  {
    id: 'auth',
    tab: 'Auth defenses',
    subject: 'noctcore/auth',
    mark: 'auth',
    form: 'passage',
    title: 'Auth you can read.',
    lead: 'The login path through the library, one module per attack. The app keeps its own routes; the flow returns a result.',
    alt: 'A login rises toward a session through reserve attempt, verify password and the epoch fence. Brute force stops at reserve attempt, account enumeration at verify password, and a revoked token at the epoch fence.',
    diagram: {
      start: 'login',
      end: 'session',
      gates: [
        { name: 'reserve attempt', stops: ['brute force'] },
        { name: 'verify password', stops: ['enumeration'] },
        { name: 'epoch fence', stops: ['revoked token'] },
      ],
    },
    detail: [
      ['reserve attempt', 'brute force', 'throttle', 'attempt budgets reserved before the hash runs', 'https://noctcore.github.io/auth/learn/brute-force-and-lockout/'],
      ['verify password', 'enumeration', 'flows/login', 'the same answer for known and unknown addresses', 'https://noctcore.github.io/auth/learn/enumeration/'],
      ['epoch fence', 'revoked token', 'session', 'revocation a racing login cannot undo', 'https://noctcore.github.io/auth/learn/revocation-races/'],
    ],
  },
  {
    id: 'showcase',
    tab: 'Showcase output',
    subject: 'noctcore/showcase-kit',
    mark: 'showcase-kit',
    form: 'passage',
    title: 'Same pixels, every run.',
    lead: 'One config drives capture, frame and export through to the images in a README. Frame and export stop nothing, so they carry no label.',
    alt: 'One config drives capture, frame and export through to README images. Running animations and half-drawn screens stop at capture, so each run produces the same pixels.',
    diagram: {
      start: 'config',
      end: 'README',
      gates: [
        { name: 'capture', stops: ['animations', 'half-drawn screen'] },
        { name: 'frame' },
        { name: 'export' },
      ],
    },
    detail: [
      ['capture', 'animations, half-drawn screen', '@noctcore/showcase-kit', 'deterministic capture in Playwright', 'https://noctcore.github.io/showcase-kit/'],
      ['frame', null, 'window, browser or terminal frame', 'six styles', 'https://noctcore.github.io/showcase-kit/gallery/'],
      ['export', null, 'WebP or PNG, README snippet', 'hero banners, clips, icons', 'https://noctcore.github.io/showcase-kit/'],
    ],
  },
];
