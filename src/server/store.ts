import fs from 'fs';
import path from 'path';
import { createInitialWorkspace } from '../data/mockWorkspace.ts';
import type { WorkspacePayload } from '../types/care.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'care-store.json');

export function readStore(): WorkspacePayload {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_PATH)) {
      const seed = createInitialWorkspace();
      fs.writeFileSync(STORE_PATH, JSON.stringify(seed, null, 2), 'utf-8');
      return seed;
    }
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    return JSON.parse(raw) as WorkspacePayload;
  } catch (err) {
    console.error('Failed to read store, falling back to seed:', err);
    return createInitialWorkspace();
  }
}

export function writeStore(data: WorkspacePayload): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}
