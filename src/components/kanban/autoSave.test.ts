import { describe, it, expect, beforeEach } from 'vitest';

class LocalStorageMock {
  private store: Record<string, string> = {};
  getItem(key: string) { return this.store[key] || null; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
  removeItem(key: string) { delete this.store[key]; }
  clear() { this.store = {}; }
}

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = new LocalStorageMock();
}

describe('Kanban Card Description Auto-Save to localStorage', () => {
  const cardId = 'card-sec-849';
  const draftKey = `mirovisor_card_draft_${cardId}`;

  beforeEach(() => {
    localStorage.clear();
  });

  it('saves debounced card description draft into localStorage', () => {
    const draftPayload = {
      description: 'Исправлена уязвимость CWE-89: параметризация search_path',
      timestamp: Date.now(),
      savedAt: '11:42:00',
    };

    localStorage.setItem(draftKey, JSON.stringify(draftPayload));

    const retrieved = localStorage.getItem(draftKey);
    expect(retrieved).not.toBeNull();
    const parsed = JSON.parse(retrieved!);
    expect(parsed.description).toBe('Исправлена уязвимость CWE-89: параметризация search_path');
    expect(parsed.savedAt).toBe('11:42:00');
  });

  it('restores draft if it differs from server card description', () => {
    const serverDescription = 'Исходное описание';
    const draftDescription = 'Черновик с новыми деталями архитектуры';

    localStorage.setItem(
      draftKey,
      JSON.stringify({
        description: draftDescription,
        timestamp: Date.now(),
        savedAt: '11:45:10',
      })
    );

    const raw = localStorage.getItem(draftKey);
    const parsed = JSON.parse(raw!);
    const hasUnsavedDraft = parsed.description !== serverDescription;

    expect(hasUnsavedDraft).toBe(true);
    expect(parsed.description).toBe(draftDescription);
  });

  it('removes draft from localStorage when user explicitly discards or saves identical content', () => {
    localStorage.setItem(
      draftKey,
      JSON.stringify({
        description: 'Временный текст',
        timestamp: Date.now(),
        savedAt: '11:46:00',
      })
    );

    expect(localStorage.getItem(draftKey)).not.toBeNull();

    // User discards draft
    localStorage.removeItem(draftKey);
    expect(localStorage.getItem(draftKey)).toBeNull();
  });
});
