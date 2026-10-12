import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Mirovisor Auto-Commit & Auto-Push on Successful Build Script
 * Rule: Automatically create a Git commit and push to GitHub whenever the build succeeds.
 */
function runCommand(cmd, cwd) {
  try {
    return execSync(cmd, { cwd, stdio: 'pipe', encoding: 'utf-8' }).trim();
  } catch (err) {
    return null;
  }
}

function autoCommitAndPushInDir(dirPath) {
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

  // Get current branch
  const currentBranch = runCommand('git rev-parse --abbrev-ref HEAD', dirPath) || 'main';

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
  const hasDevOps = statusLines.some((l) => l.includes('docker') || l.includes('workflow') || l.includes('prometheus') || l.includes('alert'));
  const hasServer = statusLines.some((l) => l.includes('server.ts') || l.includes('init-db'));
  const hasK8s = statusLines.some((l) => l.includes('k8s') || l.includes('nginx'));
  const hasContracts = statusLines.some((l) => l.includes('schemas') || l.includes('openapi'));
  const hasDocs = statusLines.some((l) => l.includes('docs') || l.includes('adr') || l.includes('c4-model'));

  if (hasK8s) {
    scope = 'infra';
    message = 'add Kubernetes manifests, Nginx reverse proxy, and Zod API contracts';
  } else if (hasContracts) {
    scope = 'contracts';
    message = 'add Zod runtime schemas and OpenAPI 3.1 contracts';
  } else if (hasDocs) {
    scope = 'docs';
    message = 'add ADR-002..004, C4 model and full engineering audit report';
  } else if (hasRules) {
    scope = 'rules';
    message = 'document mandatory auto-commit and push to GitHub on successful build';
  } else if (hasDevOps) {
    scope = 'devops';
    message = 'update CI/CD pipelines, containerization and monitoring configs';
  } else if (hasServer) {
    scope = 'gateway';
    message = 'update Express API gateway and PostgreSQL multi-tenant schema';
  } else if (hasD3 && hasKanban) {
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

    // Push to GitHub remote
    const remoteUrl = runCommand('git remote get-url origin', dirPath);
    if (remoteUrl) {
      console.log(`[Auto-Push] Pushing commit to GitHub remote (${currentBranch})...`);
      try {
        const pushResult = execSync(`git push origin ${currentBranch}`, {
          cwd: dirPath,
          stdio: 'pipe',
          encoding: 'utf-8',
        }).trim();
        console.log(`[Auto-Push Success] Successfully pushed changes to GitHub origin/${currentBranch}!`);
      } catch (pushErr) {
        console.warn(`[Auto-Push Warning] Could not push to remote: ${pushErr.message}`);
      }
    }
  } catch (err) {
    console.error(`[Auto-Commit Error] Failed to commit: ${err.message}`);
  }
}

// 1. Sync files between current working directory and git repo if needed
const cwd = process.cwd();
const targetDirs = [cwd, '/tmp/mirovisor_repo'];

for (const targetDir of targetDirs) {
  if (fs.existsSync(path.join(targetDir, '.git'))) {
    // If we're running from applet and target is /tmp/mirovisor_repo, sync workspace files
    if (cwd !== targetDir && fs.existsSync(targetDir)) {
      try {
        execSync(`cp -r ${cwd}/src/* ${targetDir}/src/ 2>/dev/null || true`);
        execSync(`cp ${cwd}/package.json ${cwd}/Dockerfile ${cwd}/docker-compose.yml ${cwd}/SECURITY.md ${cwd}/RULES.md ${cwd}/README.md ${cwd}/init-db.sql ${cwd}/prometheus.yml ${cwd}/alerts.yml ${cwd}/server.ts ${targetDir}/ 2>/dev/null || true`);
        if (fs.existsSync(path.join(cwd, '.github'))) {
          execSync(`cp -r ${cwd}/.github/* ${targetDir}/.github/ 2>/dev/null || true`);
        }
      } catch {}
    }
    autoCommitAndPushInDir(targetDir);
  }
}
