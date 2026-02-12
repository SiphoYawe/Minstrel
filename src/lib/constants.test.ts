import { APP_NAME, APP_DESCRIPTION } from '@/lib/constants';

describe('constants', () => {
  it('exports APP_NAME as Minstrel', () => {
    expect(APP_NAME).toBe('Minstrel');
  });

  it('exports APP_DESCRIPTION', () => {
    expect(APP_DESCRIPTION).toBe('AI-powered real-time MIDI practice companion');
  });
});
