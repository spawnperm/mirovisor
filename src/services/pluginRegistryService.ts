import { PluginManifest, PluginDependency } from '../types';

export class PluginError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'PluginError';
  }
}

export class PluginRegistryService {
  private plugins = new Map<string, PluginManifest>();

  constructor(initialPlugins: PluginManifest[] = []) {
    for (const plugin of initialPlugins) {
      this.plugins.set(plugin.id, plugin);
    }
  }

  public getAll(): PluginManifest[] {
    return Array.from(this.plugins.values());
  }

  public get(id: string): PluginManifest | undefined {
    return this.plugins.get(id);
  }

  public validate(manifest: PluginManifest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 1. Dependency checks
    for (const dep of manifest.dependencies) {
      const existing = this.plugins.get(dep.pluginId);
      if (!existing && !dep.optional) {
        errors.push(`Не найдена обязательная зависимость: ${dep.pluginId} (${dep.minVersion})`);
      }
    }

    // 2. Conflict checks
    for (const conflict of manifest.conflicts) {
      if (this.plugins.has(conflict.pluginId)) {
        errors.push(`Конфликт с существующим плагином: ${conflict.pluginId} (${conflict.reason})`);
      }
    }

    // 3. Circular dependency detection (DFS)
    try {
      this.detectCycles(manifest);
    } catch (e: any) {
      errors.push(e.message);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private detectCycles(manifest: PluginManifest): void {
    const visited = new Set<string>();
    const stack = new Set<string>();

    const dfs = (id: string, currentDeps: PluginDependency[]) => {
      if (stack.has(id)) {
        throw new PluginError(
          'circular-dependency',
          `Обнаружена циклическая зависимость в плагине: ${id}`
        );
      }
      if (visited.has(id)) return;
      visited.add(id);
      stack.add(id);

      for (const dep of currentDeps) {
        const next = this.plugins.get(dep.pluginId);
        if (next) {
          dfs(next.id, next.dependencies);
        }
      }
      stack.delete(id);
    };

    dfs(manifest.id, manifest.dependencies);
  }

  public installForTenant(pluginId: string, tenantId: string): { success: boolean; message: string } {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      return { success: false, message: `Плагин ${pluginId} не зарегистрирован в системе` };
    }

    if (plugin.installedInTenants.includes(tenantId)) {
      return { success: true, message: `Плагин ${plugin.name} уже активен в данном тенанте` };
    }

    const validation = this.validate(plugin);
    if (!validation.valid) {
      return { success: false, message: validation.errors.join('; ') };
    }

    plugin.installedInTenants.push(tenantId);
    return { success: true, message: `Плагин ${plugin.name} v${plugin.version} успешно установлен в схему тенанта` };
  }

  public uninstallForTenant(pluginId: string, tenantId: string): { success: boolean; message: string } {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      return { success: false, message: 'Плагин не найден' };
    }

    plugin.installedInTenants = plugin.installedInTenants.filter((id) => id !== tenantId);
    return { success: true, message: `Плагин ${plugin.name} деактивирован для тенанта` };
  }
}
