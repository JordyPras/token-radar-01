// Token Radar's radar-2 entry (Node 22, standard library only).
//
// The program reads the sealed snapshot from /input/snapshot.json (or --input <file|dir>),
// scores every pre-token protocol with the radar-2 model in lib/model.ts, writes the ranked
// board to /output/board.json, and copies this repository's dashboard/ and screenshots/ to
// /output. Last, it writes /output/dossier.json, the summary the judge reads, with the
// vendored make.fun library.
//
// Radar-2 scores the whole pre-token universe — the watchlist floor plus every rankable
// protocol below it — with five multipliers off the snapshot's own figures: TVL, seven-day
// growth, age with no token, a capped breakout bonus for young protocols already growing
// fast, and a small breadth bonus for protocols live on several chains. No protocol name
// is special-cased.
//
// The dashboard is a static page, no framework and no network: dashboard/index.html,
// dashboard/app.css and dashboard/app.js read /output/data.js, which this program writes
// from the same board. It covers the watchlist, states the model, shows each row's
// multipliers and gives every protocol a farm plan. Change the model, the page or the
// plan; keep the gate's shape.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input ../input/snapshot.json

import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MODEL, MODEL_VERSION, boardIssue, buildRadar, dataScript, parseSnapshot } from './lib/model.ts';
import { buildDossier } from './vendor/makefun-board.ts';

const here = fileURLToPath(new URL('.', import.meta.url));

/** The scorer's own caps (reference/gate.json): the text cap shapes the bytes, the rest refuse. */
const TEXT_MAX_BYTES = 65_536;
const SCREENSHOT_CAPS = { max: 4, max_bytes: 524_288 };
const IMAGE_NAME = /^[A-Za-z0-9_][A-Za-z0-9._-]{0,127}$/;

/** Write a message to stderr and stop with the given exit code. */
function fail(message: string, code: number): never {
  process.stderr.write(`token radar: ${message}\n`);
  process.exit(code);
}

/** Read a --name <value> (or --name=<value>) argument, or fall back. */
function readFlag(name: string, fallback: string): string {
  const argv = process.argv;
  const at = argv.indexOf(`--${name}`);
  if (at >= 0 && at + 1 < argv.length) return argv[at + 1]!;
  const joined = argv.find((a) => a.startsWith(`--${name}=`));
  if (joined !== undefined) return joined.slice(name.length + 3);
  return fallback;
}

/** Turn the --input argument into the snapshot file, refusing a missing one. */
function resolveSnapshotFile(inputArg: string): string {
  const file = inputArg.endsWith('.json') ? inputArg : join(inputArg, 'snapshot.json');
  if (!existsSync(file)) {
    fail(`no snapshot at ${file}: pass --input <snapshot.json|directory> or mount the sealed /input`, 2);
  }
  return file;
}

/** Read the snapshot and refuse one that cannot score a board. */
function loadSnapshot(file: string) {
  const snapshot = parseSnapshot(readFileSync(file, 'utf8'));
  if (!Array.isArray(snapshot.protocols) || snapshot.protocols.length === 0) {
    fail(`snapshot at ${file} holds no protocols: nothing to rank`, 1);
  }
  if (!Array.isArray(snapshot.watchlist) || snapshot.watchlist.length === 0) {
    fail(`snapshot at ${file} holds no watchlist: the floor cannot be checked`, 1);
  }
  return snapshot;
}

/** Write a JSON value to a file with a trailing newline. */
function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value)}\n`);
}

/** Copy one directory's regular files into `to`, skipping names that start with a dot. */
function copyRegularFiles(from: string, to: string): string[] {
  if (!existsSync(from)) return [];
  mkdirSync(to, { recursive: true });
  const copied: string[] = [];
  for (const name of readdirSync(from)) {
    if (name.startsWith('.')) continue;
    const path = join(from, name);
    if (!statSync(path).isFile()) continue;
    copyFileSync(path, join(to, name));
    copied.push(name);
  }
  return copied;
}

/** Refuse a screenshot set the gate will not take: fewer than three, or a bad name. */
function checkScreenshots(names: string[]): void {
  if (names.length < 3) {
    fail(`screenshots/ holds ${names.length} image${names.length === 1 ? '' : 's'}: hand in 3, the board, a detail view and a filtered view`, 1);
  }
  for (const name of names) {
    if (!IMAGE_NAME.test(name)) {
      fail(`screenshots/${name}: a name is letters, digits and . _ -, 1 to 128 characters`, 1);
    }
  }
}

/** Re-read the board just written and refuse it unless it is ranked strongest first. */
function checkWrittenBoard(outDir: string, expectedRows: number): void {
  const written = JSON.parse(readFileSync(join(outDir, 'board.json'), 'utf8')) as { rows: Array<{ implied_value_usd: number }> };
  if (!Array.isArray(written.rows) || written.rows.length !== expectedRows) {
    fail(`board.json holds ${Array.isArray(written.rows) ? written.rows.length : 0} rows, expected ${expectedRows}`, 1);
  }
  for (let i = 1; i < written.rows.length; i++) {
    if (written.rows[i]!.implied_value_usd > written.rows[i - 1]!.implied_value_usd) {
      fail(`board.json is not ranked strongest first at row ${i + 1}`, 1);
    }
  }
}

const inputFile = resolveSnapshotFile(readFlag('input', '/input'));
const outDir = readFlag('output', process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

// Radar-2 is wired in explicitly: the model and its version travel with the run, so the
// board, the dashboard and the log all name the same model instead of a default the page
// must guess.
const snapshot = loadSnapshot(inputFile);
const { board, radar } = buildRadar(snapshot, MODEL);
const issue = boardIssue(board, snapshot);
if (issue !== null) {
  fail(`the model wrote a board the gate refuses: ${issue}`, 1);
}

mkdirSync(outDir, { recursive: true });
writeJson(join(outDir, 'board.json'), { rows: board });
writeFileSync(join(outDir, 'data.js'), dataScript(radar));
checkWrittenBoard(outDir, board.length);

copyRegularFiles(join(here, 'dashboard'), join(outDir, 'dashboard'));
const shots = copyRegularFiles(join(here, 'screenshots'), join(outDir, 'screenshots'));
checkScreenshots(shots);

// The dossier is written last: the scorer rebuilds it from this /output and compares bytes.
writeFileSync(join(outDir, 'dossier.json'), buildDossier(outDir, { text_max_bytes: TEXT_MAX_BYTES, screenshots: SCREENSHOT_CAPS, dashboard: { max_files: 400, max_bytes: 4_194_304 } }));

process.stdout.write(
  `token radar: ${MODEL_VERSION} model, ${snapshot.protocols.length} protocols, ${snapshot.watchlist.length} on the watchlist, ${board.length} rows scored (${radar.early_size} early, ${radar.early_finds} early finds, ${radar.live_size} live set aside)\n` +
    `token radar: wrote ${join(outDir, 'board.json')}, ${join(outDir, 'data.js')}, ${join(outDir, 'dashboard')} (3 files), ${join(outDir, 'screenshots')} (${shots.length} images) and ${join(outDir, 'dossier.json')}\n`,
);
