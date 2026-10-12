import { describe, it, expect, beforeEach } from 'vitest';
import { PluginRegistryService } from './pluginRegistryService';
import { PluginManifest } from '../types';

describe('PluginRegistryService (Backstage SDK & Lifecycle)', () => {
  let registry: PluginRegistryService;

  const basePlugin: PluginManifest = {
    id: 'plugin-auth-core',
    name: 'Auth Core Microfrontend',
    version: '1.2.0',
    description: 'OAuth2 & OIDC Identity Management',
    author: 'Security WG',
    license: 'Apache-2.0',
    dependencies: [],
    conflicts: [],
    permissions: ['tenant.auth.manage'],
    category: 'security',
    priceRub: 0,
    installedInTenants: ['tenant_acme'],
    status: 'active',
  };

  beforeEach(() => {
    registry = new PluginRegistryService([basePlugin]);
  });

  it('retrieves existing plugins and validates dependencies correctly', () => {
    expect(registry.get('plugin-auth-core')).toBeDefined();
    expect(registry.getAll().length).toBe(1);

    const validChildPlugin: PluginManifest = {
      id: 'plugin-mfa-authenticator',
      name: 'MFA Authenticator Widget',
      version: '1.0.0',
      description: 'TOTP & WebAuthn multi-factor',
      author: 'Security WG',
      license: 'MIT',
      dependencies: [
        {
          pluginId: 'plugin-auth-core',
          minVersion: '1.0.0',
          optional: false,
        },
      ],
      conflicts: [],
      permissions: ['auth.mfa.verify'],
      category: 'security',
      priceRub: 0,
      installedInTenants: [],
      status: 'active',
    };

    const validation = registry.validate(validChildPlugin);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('fails validation when mandatory dependency is missing', () => {
    const invalidPlugin: PluginManifest = {
      id: 'plugin-telemetry-visualizer',
      name: 'Loki Visualizer',
      version: '2.0.0',
      description: 'Loki graph renderer',
      author: 'Observability Team',
      license: 'MIT',
      dependencies: [
        {
          pluginId: 'plugin-grafana-bridge', // Missing!
          minVersion: '1.0.0',
          optional: false,
        },
      ],
      conflicts: [],
      permissions: ['telemetry.read'],
      category: 'analytics',
      priceRub: 0,
      installedInTenants: [],
      status: 'active',
    };

    const validation = registry.validate(invalidPlugin);
    expect(validation.valid).toBe(false);
    expect(validation.errors[0]).toContain('Не найдена обязательная зависимость: plugin-grafana-bridge');
  });

  it('allows optional dependencies to be missing', () => {
    const pluginWithOptional: PluginManifest = {
      id: 'plugin-crm-export',
      name: 'CRM Excel Exporter',
      version: '1.1.0',
      description: 'Export leads to xlsx',
      author: 'BizOps',
      license: 'MIT',
      dependencies: [
        {
          pluginId: 'plugin-univer-office', // optional
          minVersion: '1.0.0',
          optional: true,
        },
      ],
      conflicts: [],
      permissions: ['crm.leads.export'],
      category: 'crm',
      priceRub: 0,
      installedInTenants: [],
      status: 'active',
    };

    const validation = registry.validate(pluginWithOptional);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('detects plugin conflicts and prevents installation', () => {
    const conflictingPlugin: PluginManifest = {
      id: 'plugin-legacy-auth',
      name: 'Legacy Basic Auth',
      version: '0.9.0',
      description: 'Deprecated basic auth',
      author: 'Unknown',
      license: 'MIT',
      dependencies: [],
      conflicts: [
        {
          pluginId: 'plugin-auth-core',
          reason: 'Incompatible with modern OIDC tokens',
        },
      ],
      permissions: [],
      category: 'security',
      priceRub: 0,
      installedInTenants: [],
      status: 'disabled',
    };

    const validation = registry.validate(conflictingPlugin);
    expect(validation.valid).toBe(false);
    expect(validation.errors[0]).toContain('Конфликт с существующим плагином: plugin-auth-core');
  });

  it('detects circular dependencies using DFS graph traversal', () => {
    // Setup circular dependencies: P1 -> P2 -> P1
    const p1: PluginManifest = {
      id: 'plugin-alpha',
      name: 'Alpha Plugin',
      version: '1.0.0',
      description: 'Alpha',
      author: 'Dev',
      license: 'MIT',
      dependencies: [{ pluginId: 'plugin-beta', minVersion: '1.0.0', optional: false }],
      conflicts: [],
      permissions: [],
      category: 'devtools',
      priceRub: 0,
      installedInTenants: [],
      status: 'active',
    };

    const p2: PluginManifest = {
      id: 'plugin-beta',
      name: 'Beta Plugin',
      version: '1.0.0',
      description: 'Beta',
      author: 'Dev',
      license: 'MIT',
      dependencies: [{ pluginId: 'plugin-alpha', minVersion: '1.0.0', optional: false }],
      conflicts: [],
      permissions: [],
      category: 'devtools',
      priceRub: 0,
      installedInTenants: [],
      status: 'active',
    };

    const circRegistry = new PluginRegistryService([p1, p2]);
    const validation = circRegistry.validate(p1);

    expect(validation.valid).toBe(false);
    expect(validation.errors.some((err) => err.includes('циклическая зависимость'))).toBe(true);
  });
});
