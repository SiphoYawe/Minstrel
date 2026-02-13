import posthog from 'posthog-js';

vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(),
    capture: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
    captureException: vi.fn(),
    get_distinct_id: vi.fn(() => 'distinct-123'),
    get_session_id: vi.fn(() => 'session-456'),
  },
}));

describe('analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
  });

  describe('capture', () => {
    it('does not capture events without NEXT_PUBLIC_POSTHOG_KEY', async () => {
      delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
      const { capture } = await import('@/lib/analytics');
      capture('test_event', { key: 'value' });
      expect(posthog.capture).not.toHaveBeenCalled();
    });

    it('captures events when key is present', async () => {
      process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test_key';
      const { capture } = await import('@/lib/analytics');
      capture('test_event', { key: 'value' });
      expect(posthog.capture).toHaveBeenCalledWith('test_event', { key: 'value' });
    });
  });

  describe('identify', () => {
    it('does not identify without NEXT_PUBLIC_POSTHOG_KEY', async () => {
      delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
      const { identify } = await import('@/lib/analytics');
      identify('user-123');
      expect(posthog.identify).not.toHaveBeenCalled();
    });

    it('identifies user when key is present', async () => {
      process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test_key';
      const { identify } = await import('@/lib/analytics');
      identify('user-123', { plan: 'pro' });
      expect(posthog.identify).toHaveBeenCalledWith('user-123', { plan: 'pro' });
    });
  });

  describe('reset', () => {
    it('resets posthog when key is present', async () => {
      process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test_key';
      const { reset } = await import('@/lib/analytics');
      reset();
      expect(posthog.reset).toHaveBeenCalled();
    });
  });

  describe('getDistinctId', () => {
    it('returns undefined without key', async () => {
      delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
      const { getDistinctId } = await import('@/lib/analytics');
      expect(getDistinctId()).toBeUndefined();
    });

    it('returns distinct id when key is present', async () => {
      process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test_key';
      const { getDistinctId } = await import('@/lib/analytics');
      expect(getDistinctId()).toBe('distinct-123');
    });
  });
});
