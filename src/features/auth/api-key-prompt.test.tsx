import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test-utils/render';
import { ApiKeyPrompt } from './api-key-prompt';
import type { ApiKeyMetadata } from './auth-types';

const mockMetadata: ApiKeyMetadata = {
  provider: 'openai',
  lastFour: 'a4Bx',
  status: 'active',
  createdAt: '2026-02-13T00:00:00Z',
  updatedAt: '2026-02-13T00:00:00Z',
};

const defaultProps = {
  keyMetadata: null as ApiKeyMetadata | null,
  onSave: vi.fn(),
  onDelete: vi.fn(),
  isSubmitting: false,
  submitError: null as string | null,
};

beforeEach(() => {
  vi.clearAllMocks();
  defaultProps.onSave = vi.fn();
  defaultProps.onDelete = vi.fn();
});

describe('ApiKeyPrompt', () => {
  describe('form mode (no key configured)', () => {
    it('renders provider selector and key input', () => {
      render(<ApiKeyPrompt {...defaultProps} />);
      expect(screen.getByText('Provider')).toBeInTheDocument();
      expect(screen.getByText('API Key')).toBeInTheDocument();
      expect(screen.getByLabelText(/API key/i)).toBeInTheDocument();
    });

    it('renders BYOK onboarding text when no key exists', () => {
      render(<ApiKeyPrompt {...defaultProps} />);
      expect(screen.getByText(/Bring-Your-Own-Key/)).toBeInTheDocument();
      expect(screen.getByText(/encrypted and never shared/)).toBeInTheDocument();
    });

    it('renders provider documentation links', () => {
      render(<ApiKeyPrompt {...defaultProps} />);
      const openaiLink = screen.getByText('OpenAI API Keys');
      const anthropicLink = screen.getByText('Anthropic API Keys');
      expect(openaiLink).toHaveAttribute('href', 'https://platform.openai.com/api-keys');
      expect(openaiLink).toHaveAttribute('target', '_blank');
      expect(openaiLink).toHaveAttribute('rel', 'noopener noreferrer');
      expect(anthropicLink).toHaveAttribute('href', 'https://console.anthropic.com/settings/keys');
    });

    it('uses password input type for API key field', () => {
      render(<ApiKeyPrompt {...defaultProps} />);
      const input = screen.getByLabelText(/API key/i);
      expect(input).toHaveAttribute('type', 'password');
    });

    it('renders Save Key button', () => {
      render(<ApiKeyPrompt {...defaultProps} />);
      expect(screen.getByText('Save Key')).toBeInTheDocument();
    });

    it('disables Save Key when input is empty', () => {
      render(<ApiKeyPrompt {...defaultProps} />);
      const button = screen.getByText('Save Key');
      expect(button).toBeDisabled();
    });

    it('enables Save Key when input has content', () => {
      render(<ApiKeyPrompt {...defaultProps} />);
      const input = screen.getByLabelText(/API key/i);
      fireEvent.change(input, { target: { value: 'sk-test-key-12345' } });
      const button = screen.getByText('Save Key');
      expect(button).not.toBeDisabled();
    });

    it('shows validation error for too-short key', async () => {
      const onSave = vi.fn();
      render(<ApiKeyPrompt {...defaultProps} onSave={onSave} />);
      const input = screen.getByLabelText(/API key/i);
      fireEvent.change(input, { target: { value: 'short' } });
      fireEvent.click(screen.getByText('Save Key'));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
      expect(onSave).not.toHaveBeenCalled();
    });

    it('calls onSave with provider and key on valid submission', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      render(<ApiKeyPrompt {...defaultProps} onSave={onSave} />);
      const input = screen.getByLabelText(/API key/i);
      fireEvent.change(input, { target: { value: 'sk-test-key-1234567890' } });
      fireEvent.click(screen.getByText('Save Key'));

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith('openai', 'sk-test-key-1234567890');
      });
    });

    it('shows loading state during submission', () => {
      render(<ApiKeyPrompt {...defaultProps} isSubmitting={true} />);
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('shows submit error from props', () => {
      render(<ApiKeyPrompt {...defaultProps} submitError="The API key is invalid." />);
      expect(screen.getByText('The API key is invalid.')).toBeInTheDocument();
    });

    it('catches onSave rejection without propagating', async () => {
      const onSave = vi.fn().mockRejectedValue(new Error('server error'));
      render(<ApiKeyPrompt {...defaultProps} onSave={onSave} />);
      const input = screen.getByLabelText(/API key/i);
      fireEvent.change(input, { target: { value: 'sk-test-key-1234567890' } });
      // Should not throw an unhandled rejection
      fireEvent.click(screen.getByText('Save Key'));
      await waitFor(() => {
        expect(onSave).toHaveBeenCalled();
      });
    });

    it('does not show BYOK text when editing an existing key', () => {
      render(<ApiKeyPrompt {...defaultProps} keyMetadata={mockMetadata} />);
      // Initially in display mode — click Update Key
      fireEvent.click(screen.getByText('Update Key'));
      // Should be in form mode now but BYOK text should be hidden
      expect(screen.queryByText(/Bring-Your-Own-Key/)).not.toBeInTheDocument();
    });
  });

  describe('display mode (key configured)', () => {
    it('shows masked key with provider name', () => {
      render(<ApiKeyPrompt {...defaultProps} keyMetadata={mockMetadata} />);
      expect(screen.getByText('OpenAI: sk-...a4Bx')).toBeInTheDocument();
    });

    it('shows Active badge for active key', () => {
      render(<ApiKeyPrompt {...defaultProps} keyMetadata={mockMetadata} />);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('shows Invalid badge for invalid key', () => {
      const invalidMeta: ApiKeyMetadata = { ...mockMetadata, status: 'invalid' };
      render(<ApiKeyPrompt {...defaultProps} keyMetadata={invalidMeta} />);
      expect(screen.getByText('Invalid')).toBeInTheDocument();
    });

    it('shows Validating badge for validating key', () => {
      const validatingMeta: ApiKeyMetadata = { ...mockMetadata, status: 'validating' };
      render(<ApiKeyPrompt {...defaultProps} keyMetadata={validatingMeta} />);
      expect(screen.getByText('Validating')).toBeInTheDocument();
    });

    it('shows correct masked prefix for Other provider', () => {
      const otherMeta: ApiKeyMetadata = {
        ...mockMetadata,
        provider: 'other',
        lastFour: 'xYz1',
      };
      render(<ApiKeyPrompt {...defaultProps} keyMetadata={otherMeta} />);
      // Other provider has no prefix — should not show "sk-"
      expect(screen.getByText('Other: ...xYz1')).toBeInTheDocument();
    });

    it('shows Update Key and Remove Key buttons', () => {
      render(<ApiKeyPrompt {...defaultProps} keyMetadata={mockMetadata} />);
      expect(screen.getByText('Update Key')).toBeInTheDocument();
      expect(screen.getByText('Remove Key')).toBeInTheDocument();
    });

    it('switches to form mode on Update Key click', () => {
      render(<ApiKeyPrompt {...defaultProps} keyMetadata={mockMetadata} />);
      fireEvent.click(screen.getByText('Update Key'));
      // Should now see form elements
      expect(screen.getByLabelText(/API key/i)).toBeInTheDocument();
      expect(screen.getByText('Save Key')).toBeInTheDocument();
    });

    it('shows Cancel button in edit mode', () => {
      render(<ApiKeyPrompt {...defaultProps} keyMetadata={mockMetadata} />);
      fireEvent.click(screen.getByText('Update Key'));
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('returns to display mode on Cancel click', () => {
      render(<ApiKeyPrompt {...defaultProps} keyMetadata={mockMetadata} />);
      fireEvent.click(screen.getByText('Update Key'));
      fireEvent.click(screen.getByText('Cancel'));
      expect(screen.getByText('OpenAI: sk-...a4Bx')).toBeInTheDocument();
    });

    it('shows confirmation dialog on Remove Key click', () => {
      render(<ApiKeyPrompt {...defaultProps} keyMetadata={mockMetadata} />);
      fireEvent.click(screen.getByText('Remove Key'));
      expect(
        screen.getByText('Remove your API key? AI features will be disabled.')
      ).toBeInTheDocument();
    });

    it('calls onDelete when confirmation is accepted', async () => {
      const onDelete = vi.fn().mockResolvedValue(undefined);
      render(<ApiKeyPrompt {...defaultProps} keyMetadata={mockMetadata} onDelete={onDelete} />);
      fireEvent.click(screen.getByText('Remove Key'));
      // Click the "Remove" action in the dialog
      fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

      await waitFor(() => {
        expect(onDelete).toHaveBeenCalledWith('openai');
      });
    });
  });

  describe('accessibility', () => {
    it('has aria-invalid on input when error exists', () => {
      render(<ApiKeyPrompt {...defaultProps} submitError="Invalid key" />);
      const input = screen.getByLabelText(/API key/i);
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('links input to error via aria-describedby', () => {
      render(<ApiKeyPrompt {...defaultProps} submitError="Invalid key" />);
      const input = screen.getByLabelText(/API key/i);
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      const errorEl = document.getElementById(describedBy!);
      expect(errorEl).toHaveTextContent('Invalid key');
    });

    it('error message has role="alert"', () => {
      render(<ApiKeyPrompt {...defaultProps} submitError="Something went wrong" />);
      expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    });
  });
});
