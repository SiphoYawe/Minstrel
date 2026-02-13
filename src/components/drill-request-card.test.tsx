import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test-utils/render';
import userEvent from '@testing-library/user-event';
import { DrillRequestCard } from './drill-request-card';

const defaultProps = {
  weakness: 'Inconsistent timing on chord transitions',
  focusArea: 'Practice smooth C to Am changes at 80 BPM',
  onGenerate: vi.fn(),
  onCancel: vi.fn(),
  isGenerating: false,
};

describe('DrillRequestCard', () => {
  it('renders the Drill Request header', () => {
    render(<DrillRequestCard {...defaultProps} />);
    expect(screen.getByText('Drill Request')).toBeInTheDocument();
  });

  it('displays the identified weakness', () => {
    render(<DrillRequestCard {...defaultProps} />);
    expect(screen.getByText('Identified Weakness')).toBeInTheDocument();
    expect(screen.getByText(defaultProps.weakness)).toBeInTheDocument();
  });

  it('displays the suggested focus area', () => {
    render(<DrillRequestCard {...defaultProps} />);
    expect(screen.getByText('Suggested Focus')).toBeInTheDocument();
    expect(screen.getByText(defaultProps.focusArea)).toBeInTheDocument();
  });

  it('calls onGenerate when Generate is clicked', async () => {
    const user = userEvent.setup();
    const onGenerate = vi.fn();
    render(<DrillRequestCard {...defaultProps} onGenerate={onGenerate} />);
    await user.click(screen.getByRole('button', { name: /generate/i }));
    expect(onGenerate).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<DrillRequestCard {...defaultProps} onCancel={onCancel} />);
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('disables buttons when isGenerating is true', () => {
    render(<DrillRequestCard {...defaultProps} isGenerating={true} />);
    expect(screen.getByRole('button', { name: /generating/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });

  it('shows "Generating..." text when isGenerating', () => {
    render(<DrillRequestCard {...defaultProps} isGenerating={true} />);
    expect(screen.getByText('Generating...')).toBeInTheDocument();
  });
});
