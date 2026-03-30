#!/usr/bin/env node

/**
 * Lightweight metadata consistency validator for this skill package.
 * Run: node validate-metadata.js
 */
const fs = require('fs');
const path = require('path');

const skillDir = __dirname;
const registryPath = path.join(skillDir, 'registry.yaml');
const skillPath = path.join(skillDir, 'SKILL.md');

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function parseFrontmatterEnvVars(skillMd) {
  const match = skillMd.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return [];
  const body = match[1];
  const envBlock = body.match(/environment_variables:\n((?:\s+-\s+[A-Z0-9_]+\n?)+)/);
  if (!envBlock) return [];
  return envBlock[1]
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^- /, '').trim());
}

function parseRegistryList(yamlText, key) {
  const block = yamlText.match(new RegExp(`${key}:\\n((?:\\s+-\\s+[A-Z0-9_]+\\n?)+)`));
  if (!block) return [];
  return block[1]
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^- /, '').trim());
}

function parseRegistryValue(yamlText, key) {
  const line = yamlText.match(new RegExp(`^${key}:\\s+(.+)$`, 'm'));
  return line ? line[1].trim() : '';
}

function sorted(values) {
  return [...new Set(values)].sort();
}

function equalArray(a, b) {
  return JSON.stringify(sorted(a)) === JSON.stringify(sorted(b));
}

function fail(msg) {
  console.error(`ERROR: ${msg}`);
  process.exitCode = 1;
}

function main() {
  const registry = readFile(registryPath);
  const skill = readFile(skillPath);

  const fromSkill = parseFrontmatterEnvVars(skill);
  const fromRequiredCredentials = parseRegistryList(registry, 'required_credentials');
  const fromRequiredEnvVars = parseRegistryList(registry, 'required_env_vars');
  const primaryCredential = parseRegistryValue(registry, 'primary_credential');
  const homepage = parseRegistryValue(registry, 'homepage');

  if (!equalArray(fromSkill, fromRequiredCredentials)) {
    fail(
      `SKILL.md environment_variables (${sorted(fromSkill).join(', ') || 'none'}) `
      + `!= registry.required_credentials (${sorted(fromRequiredCredentials).join(', ') || 'none'})`
    );
  }

  if (!equalArray(fromRequiredCredentials, fromRequiredEnvVars)) {
    fail(
      `registry.required_credentials (${sorted(fromRequiredCredentials).join(', ') || 'none'}) `
      + `!= registry.required_env_vars (${sorted(fromRequiredEnvVars).join(', ') || 'none'})`
    );
  }

  if (!primaryCredential) {
    fail('registry.primary_credential is empty');
  }

  if (!homepage || homepage === 'none') {
    fail('registry.homepage is missing or "none"');
  }

  if (process.exitCode === 1) {
    console.error('Metadata consistency check failed.');
    return;
  }

  console.log('Metadata consistency check passed.');
}

main();
