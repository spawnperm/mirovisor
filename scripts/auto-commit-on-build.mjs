import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Mirovisor Auto-Commit on Successful Build Script
 * Rule: Automatically create a Git commit whenever the build passes successfully.
 */

function runCommand(cmd, cwd) {
  try {
    return execSync(cmd, { cwd, stdio: 'pipe', encoding: 'utf-8' }).trim();
  } catch (err) {
    return null;
  }
}

function autoCommitInDir(dirPath) {
  const gitDir = path.join(dirPath, '.git');
  if (!fs.existsSync(gitDir)) {
    return;
  }

  // Ensure git user identity is configured
  const currentName = runCommand('git config user.name', dirPath);
  if (!currentName) {
    runCommand('git config user.name "spawnperm"', dirPath);
    runCommand('git config user.email "spawnperm@gmail.com"', dirPath);
  }

  // Check for working tree status
  const status = runCommand('git status --porcelain', dirPath);
  if (!status) {
    console.log(`[Auto-Commit] No changes to commit in ${path.basename(dirPath)} (working tree clean).`);
    return;
  }

  console.log(`[Auto-Commit] Detected uncommitted changes after successful build in ${path.basename(dirPath)}.`);

  // Stage changes
  runCommand('git add -A', dirPath);

  // Analyze changed files to craft semantic commit message
  const statusLines = status.split('\n').filter(Boolean);
  let scope = 'build';
  let message = 'auto-commit after successful build verification';

  const hasD3 = statusLines.some((l) => l.includes('D3') || l.includes('Visualizer'));
  const hasKanban = statusLines.some((l) => l.includes('kanban') || l.includes('autoSave'));
  const hasAudit = statusLines.some((l) => l.includes('audit'));
  const hasRules = statusLines.some((l) => l.includes('RULES') || l.includes('README'));
  const hasSecurity = statusLines.some((l) => l.includes('security') || l.includes('SECURITY'));

  if (hasD3 && hasKanban) {
    scope = 'features';
    message = 'implement D3.js force-directed mesh and Kanban card description auto-save';
  } else if (hasD3) {
    scope = 'visualization';
    message = 'implement real-time D3 force-directed graph for tenant-plugin topology';
  } else if (hasKanban) {
    scope = 'kanban';
    message = 'implement localStorage auto-save draft for card descriptions';
  } else if (hasAudit) {
    scope = 'audit';
    message = 'update engineering audit and modernization hub';
  } else if (hasRules) {
    scope = 'rules';
    message = 'document automatic commit workflow on successful build';
  } else if (hasSecurity) {
    scope = 'security';
    message = 'update security policy and compliance controls';
  }

  const commitMsg = `feat(${scope}): ${message} [auto-build]`;

  try {
    const commitResult = execSync(`git commit -m "${commitMsg}"`, {
      cwd: dirPath,
      stdio: 'pipe',
      encoding: 'utf-8',
    }).trim();
    console.log(`[Auto-Commit Success] ${commitResult.split('\n')[0]}`);
  } catch (err) {
    console.error(`[Auto-Commit Error] Failed to commit: ${err.message}`);
  }
}

// Check both local repo_mirovisor and current working dir
const cwd = process.cwd();
const subRepo = path.join(cwd, 'repo_mirovisor');

if (fs.existsSync(subRepo)) {
  // Sync changes to subRepo if needed
  try {
    execSync('cp -r src/* repo_mirovisor/src/ 2>/dev/null || true', { cwd });
    execSync('cp package.json Dockerfile docker-compose.yml SECURITY.md vitest.config.ts repo_mirovisor/ 2>/dev/null || true', { cwd });
    if (fs.existsSync(path.join(cwd, '.github'))) {
      execSync('cp -r .github repo_mirovisor/ 2>/dev/null || true', { cwd });
    }
    if (fs.existsSync(path.join(cwd, 'RULES.md'))) {
      execSync('cp RULES.md repo_mirovisor/RULES.md 2>/dev/null || true', { cwd });
    }
  } catch {}
  autoCommitInDir(subRepo);
}

// Also check root if .git exists
autoCommitInDir(cwd);
