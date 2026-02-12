import posthog from 'posthog-js';

vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(),
    capture: vi.fn(),
    identify: vi.fn(),
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

  describe('init', () => {
    it('does not initialize without NEXT_PUBLIC_POSTHOG_KEY', async () => {
      delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
      const { init } = await import('@/lib/analytics');
      init();
      expect(posthog.init).not.toHaveBeenCalled();
    });

    it('initializes posthog when key is present', async () => {
      process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test_key';
      const { init } = await import('@/lib/analytics');
      init();
      expect(posthog.init).toHaveBeenCalledWith(
        'phc_test_key',
        expect.objectContaining({
          person_profiles: 'identified_only',
          capture_pageview: false,
        })
      );
    });

    it('does not initialize twice', async () => {
      process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test_key';
      const { init } = await import('@/lib/analytics');
      init();
      init();
      expect(posthog.init).toHaveBeenCalledTimes(1);
    });
  });

  describe('capture', () => {
    it('does not capture events before init', async () => {
      const { capture } = await import('@/lib/analytics');
      capture('test_event', { key: 'value' });
      expect(posthog.capture).not.toHaveBeenCalled();
    });

    it('captures events after init', async () => {
      process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test_key';
      const { init, capture } = await import('@/lib/analytics');
      init();
      capture('test_event', { key: 'value' });
      expect(posthog.capture).toHaveBeenCalledWith('test_event', { key: 'value' });
    });
  });

  describe('identify', () => {
    it('does not identify before init', async () => {
      const { identify } = await import('@/lib/analytics');
      identify('user-123');
      expect(posthog.identify).not.toHaveBeenCalled();
    });

    it('identifies user after init', async () => {
      process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test_key';
      const { init, identify } = await import('@/lib/analytics');
      init();
      identify('user-123', { plan: 'pro' });
      expect(posthog.identify).toHaveBeenCalledWith('user-123', { plan: 'pro' });
    });
  });
});
