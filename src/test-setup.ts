vi.mock('@tauri-apps/api/core', () => ({
    convertFileSrc: vi.fn((path: string) => `asset://localhost/${path}`),
    invoke: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-sql', () => ({
    default: vi.fn().mockReturnValue(() => ({
        close: vi.fn(),
        execute: vi.fn().mockResolvedValue({ rowsAffected: 0 }),
        select: vi.fn().mockResolvedValue([]),
    })),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
    open: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-fs', () => ({
    exists: vi.fn().mockResolvedValue(false),
    readTextFile: vi.fn(),
}));

vi.mock('@tauri-apps/api/path', () => ({
    documentDir: vi.fn().mockResolvedValue('/mock/home'),
    join: vi.fn((...parts: string[]) => parts.join('/')),
}));

vi.mock('@tauri-apps/plugin-opener', () => ({
    openUrl: vi.fn(),
}));
