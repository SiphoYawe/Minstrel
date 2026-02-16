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
  describe('wizard mode (initial setup, no existing key)', () => {
    it('renders step 1 (provider selection) when no key exists', () => {
      render(<ApiKeyPrompt {...defaultProps} />);
      expect(screen.getByText(/step 1: choose provider/i)).toBeInTheDocument();
      // Check for provider buttons specifically
      const buttons = screen.getAllByRole('button');
      const buttonTexts = buttons.map((btn) => btn.textContent);
      expect(buttonTexts).toContain(
        'OpenAIGPT-4, GPT-3.5-turbo models. Best for conversational AI coaching.'
      );
      expect(buttonTexts).toContain(
        'AnthropicClaude models. Extended context, precise technical feedback.'
      );
      expect(buttonTexts).toContain(
        'Other ProviderOpenAI-compatible API (Groq, OpenRouter, local models).'
      );
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });

    it('renders BYOK onboarding text when no key exists', () => {
      render(<ApiKeyPrompt {...defaultProps} />);
      expect(screen.getByText(/Bring-Your-Own-Key/)).toBeInTheDocument();
      expect(screen.getByText(/encrypted and never shared/)).toBeInTheDocument();
    });

    it('shows step indicator with current step highlighted', () => {
      render(<ApiKeyPrompt {...defaultProps} />);
      const stepIndicators = screen.getAllByText(/^[123]$/);
      expect(stepIndicators).toHaveLength(3);
    });

    it('navigates from step 1 to step 2 when Next is clicked', async () => {
      render(<ApiKeyPrompt {...defaultProps} />);
      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/step 2: get your key/i)).toBeInTheDocument();
      });
    });

    it('shows provider-specific guidance on step 2 for OpenAI', async () => {
      render(<ApiKeyPrompt {...defaultProps} />);
      // OpenAI is selected by default
      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/openai api key/i)).toBeInTheDocument();
        expect(screen.getByText(/platform\.openai\.com/i)).toBeInTheDocument();
      });
      expect(screen.getByRole('link', { name: /open openai platform/i })).toHaveAttribute(
        'href',
        'https://platform.openai.com/api-keys'
      );
    });

    it('shows provider-specific guidance on step 2 for Anthropic', async () => {
      render(<ApiKeyPrompt {...defaultProps} />);

      // Select Anthropic
      const anthropicButton = screen.getByRole('button', { name: /anthropic/i });
      fireEvent.click(anthropicButton);

      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/anthropic api key/i)).toBeInTheDocument();
        expect(screen.getByText(/console\.anthropic\.com/i)).toBeInTheDocument();
      });
      expect(screen.getByRole('link', { name: /open anthropic console/i })).toHaveAttribute(
        'href',
        'https://console.anthropic.com/settings/keys'
      );
    });

    it('shows other provider documentation on step 2', async () => {
      render(<ApiKeyPrompt {...defaultProps} />);

      // Select Other
      const otherButton = screen.getByRole('button', { name: /other provider/i });
      fireEvent.click(otherButton);

      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/other providers/i)).toBeInTheDocument();
        expect(screen.getByText(/groq/i)).toBeInTheDocument();
        expect(screen.getByText(/openrouter/i)).toBeInTheDocument();
        expect(screen.getByText(/ollama/i)).toBeInTheDocument();
      });
    });

    it('navigates from step 2 to step 3 when Next is clicked', async () => {
      render(<ApiKeyPrompt {...defaultProps} />);

      // Go to step 2
      fireEvent.click(screen.getByRole('button', { name: /next/i }));

      // Go to step 3
      await waitFor(() => {
        expect(screen.getByText(/step 2: get your key/i)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText(/step 3: enter key/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/openai api key/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /save key/i })).toBeInTheDocument();
      });
    });

    it('navigates back from step 3 to step 2 when Back is clicked', async () => {
      render(<ApiKeyPrompt {...defaultProps} />);

      // Navigate to step 3
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        expect(screen.getByText(/step 2/i)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        expect(screen.getByText(/step 3/i)).toBeInTheDocument();
      });

      // Go back
      fireEvent.click(screen.getByRole('button', { name: /back/i }));

      await waitFor(() => {
        expect(screen.getByText(/step 2: get your key/i)).toBeInTheDocument();
      });
    });

    it('navigates back from step 2 to step 1 when Back is clicked', async () => {
      render(<ApiKeyPrompt {...defaultProps} />);

      // Navigate to step 2
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        expect(screen.getByText(/step 2/i)).toBeInTheDocument();
      });

      // Go back
      fireEvent.click(screen.getByRole('button', { name: /back/i }));

      await waitFor(() => {
        expect(screen.getByText(/step 1: choose provider/i)).toBeInTheDocument();
      });
    });

    it('can complete the full wizard flow', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      render(<ApiKeyPrompt {...defaultProps} onSave={onSave} />);

      // Step 1: Select provider
      const anthropicButton = screen.getByRole('button', { name: /anthropic/i });
      fireEvent.click(anthropicButton);
      fireEvent.click(screen.getByRole('button', { name: /next/i }));

      // Step 2: View guidance
      await waitFor(() => {
        expect(screen.getByText(/anthropic api key/i)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));

      // Step 3: Enter key and save
      await waitFor(() => {
        expect(screen.getByText(/step 3/i)).toBeInTheDocument();
      });
      const keyInput = screen.getByLabelText(/anthropic api key/i);
      fireEvent.change(keyInput, { target: { value: 'sk-ant-test1234567890' } });

      const saveButton = screen.getByRole('button', { name: /save key/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith('anthropic', 'sk-ant-test1234567890');
      });
    });

    it('shows placeholder hint based on selected provider', async () => {
      render(<ApiKeyPrompt {...defaultProps} />);

      // Navigate to step 3 (OpenAI default)
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        expect(screen.getByText(/step 2/i)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        expect(screen.getByText(/step 3/i)).toBeInTheDocument();
      });

      const keyInput = screen.getByLabelText(/openai api key/i) as HTMLInputElement;
      expect(keyInput.placeholder).toBe('sk-...');
    });

    it('disables Save button when API key is empty', async () => {
      render(<ApiKeyPrompt {...defaultProps} />);

      // Navigate to step 3
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        expect(screen.getByText(/step 2/i)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        expect(screen.getByText(/step 3/i)).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /save key/i });
      expect(saveButton).toBeDisabled();
    });

    it('uses password input type for API key field', async () => {
      render(<ApiKeyPrompt {...defaultProps} />);

      // Navigate to step 3
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        expect(screen.getByText(/step 2/i)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        expect(screen.getByText(/step 3/i)).toBeInTheDocument();
      });

      const input = screen.getByLabelText(/api key/i);
      expect(input).toHaveAttribute('type', 'password');
    });

    it('displays validation error on step 3', async () => {
      render(<ApiKeyPrompt {...defaultProps} submitError="Invalid key format" />);

      // Navigate to step 3
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        expect(screen.getByText(/step 2/i)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        expect(screen.getByText(/step 3/i)).toBeInTheDocument();
      });

      expect(screen.getByRole('alert')).toHaveTextContent('Invalid key format');
    });

    it('shows loading state during save', async () => {
      render(<ApiKeyPrompt {...defaultProps} isSubmitting={true} />);

      // Navigate to step 3
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        expect(screen.getByText(/step 2/i)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        expect(screen.getByText(/step 3/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/saving\.\.\./i)).toBeInTheDocument();
    });

    it('highlights selected provider in step 1', async () => {
      render(<ApiKeyPrompt {...defaultProps} />);

      const anthropicButton = screen.getByRole('button', { name: /anthropic/i });
      fireEvent.click(anthropicButton);

      // Check for visual indication (border-primary class)
      expect(anthropicButton).toHaveClass('border-primary');
    });

    it('persists provider selection across steps', async () => {
      render(<ApiKeyPrompt {...defaultProps} />);

      // Select Anthropic
      const anthropicButton = screen.getByRole('button', { name: /anthropic/i });
      fireEvent.click(anthropicButton);

      // Navigate to step 2
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        expect(screen.getByText(/anthropic api key/i)).toBeInTheDocument();
      });

      // Navigate to step 3
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        expect(screen.getByLabelText(/anthropic api key/i)).toBeInTheDocument();
      });

      // Navigate back to step 1
      fireEvent.click(screen.getByRole('button', { name: /back/i }));
      await waitFor(() => {
        expect(screen.getByText(/step 2/i)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole('button', { name: /back/i }));
      await waitFor(() => {
        expect(screen.getByText(/step 1/i)).toBeInTheDocument();
      });

      // Anthropic should still be selected
      const anthropicButtonAgain = screen.getByRole('button', { name: /anthropic/i });
      expect(anthropicButtonAgain).toHaveClass('border-primary');
    });

    it('catches onSave rejection without propagating', async () => {
      const onSave = vi.fn().mockRejectedValue(new Error('server error'));
      render(<ApiKeyPrompt {...defaultProps} onSave={onSave} />);

      // Navigate to step 3
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        expect(screen.getByText(/step 2/i)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        expect(screen.getByText(/step 3/i)).toBeInTheDocument();
      });

      const input = screen.getByLabelText(/api key/i);
      fireEvent.change(input, { target: { value: 'sk-test-key-1234567890' } });
      // Should not throw an unhandled rejection
      fireEvent.click(screen.getByText('Save Key'));
      await waitFor(() => {
        expect(onSave).toHaveBeenCalled();
      });
    });
  });

  describe('display mode (key configured)', () => {
    it('shows masked key with provider name', () => {
      render(<ApiKeyPrompt {...defaultProps} keyMetadata={mockMetadata} />);
      expect(screen.getByText('OpenAI: sk-...a4Bx')).toBeInTheDocument();
    });

    it('does NOT show wizard in display mode', () => {
      render(<ApiKeyPrompt {...defaultProps} keyMetadata={mockMetadata} />);
      expect(screen.queryByText(/step 1: choose provider/i)).not.toBeInTheDocument();
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

  describe('edit mode (updating existing key)', () => {
    it('shows simplified form (not wizard) when editing existing key', async () => {
      render(<ApiKeyPrompt {...defaultProps} keyMetadata={mockMetadata} />);

      const updateButton = screen.getByRole('button', { name: /update key/i });
      fireEvent.click(updateButton);

      // Should show form fields, but NOT wizard steps
      expect(screen.queryByText(/step 1: choose provider/i)).not.toBeInTheDocument();
      expect(screen.getByLabelText(/provider/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/api key/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save key/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
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

    it('does not show BYOK text when editing an existing key', () => {
      render(<ApiKeyPrompt {...defaultProps} keyMetadata={mockMetadata} />);
      // Initially in display mode — click Update Key
      fireEvent.click(screen.getByText('Update Key'));
      // Should be in form mode now but BYOK text should be hidden
      expect(screen.queryByText(/Bring-Your-Own-Key/)).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has aria-invalid on input when error exists (wizard step 3)', async () => {
      render(<ApiKeyPrompt {...defaultProps} submitError="Invalid key" />);

      // Navigate to step 3 where the input field is
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        expect(screen.getByText(/step 2/i)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        expect(screen.getByText(/step 3/i)).toBeInTheDocument();
      });

      const input = screen.getByLabelText(/API key/i);
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('links input to error via aria-describedby (wizard step 3)', async () => {
      render(<ApiKeyPrompt {...defaultProps} submitError="Invalid key" />);

      // Navigate to step 3 where the input field is
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        expect(screen.getByText(/step 2/i)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        expect(screen.getByText(/step 3/i)).toBeInTheDocument();
      });

      const input = screen.getByLabelText(/API key/i);
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      const errorEl = document.getElementById(describedBy!);
      expect(errorEl).toHaveTextContent('Invalid key');
    });

    it('error message has role="alert" (wizard step 3)', async () => {
      render(<ApiKeyPrompt {...defaultProps} submitError="Something went wrong" />);

      // Navigate to step 3 where the error would be displayed
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        expect(screen.getByText(/step 2/i)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        expect(screen.getByText(/step 3/i)).toBeInTheDocument();
      });

      expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    });
  });

  describe('validation stages (Story 27-2)', () => {
    it('shows validation stages during submission', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      render(<ApiKeyPrompt {...defaultProps} onSave={onSave} />);

      // Navigate to step 3
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => expect(screen.getByText(/step 2/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => expect(screen.getByText(/step 3/i)).toBeInTheDocument());

      const input = screen.getByLabelText(/api key/i);
      fireEvent.change(input, { target: { value: 'sk-test-key-1234567890' } });
      fireEvent.click(screen.getByRole('button', { name: /save key/i }));

      // During validation, should show the stages
      await waitFor(() => {
        expect(screen.getByText(/Checking format/i)).toBeInTheDocument();
      });
    });

    it('shows format error when key has wrong prefix for OpenAI', async () => {
      const onSave = vi.fn();
      render(<ApiKeyPrompt {...defaultProps} onSave={onSave} />);

      // Navigate to step 3
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => expect(screen.getByText(/step 2/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => expect(screen.getByText(/step 3/i)).toBeInTheDocument());

      const input = screen.getByLabelText(/api key/i);
      fireEvent.change(input, { target: { value: 'bad-key-1234567890' } });
      fireEvent.click(screen.getByRole('button', { name: /save key/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/start with 'sk-'/i);
      });
      expect(onSave).not.toHaveBeenCalled();
    });

    it('shows format error when key has wrong prefix for Anthropic', async () => {
      const onSave = vi.fn();
      render(<ApiKeyPrompt {...defaultProps} onSave={onSave} />);

      // Select Anthropic
      fireEvent.click(screen.getByText('Anthropic'));
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => expect(screen.getByText(/step 2/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => expect(screen.getByText(/step 3/i)).toBeInTheDocument());

      const input = screen.getByLabelText(/api key/i);
      fireEvent.change(input, { target: { value: 'sk-wrong-1234567890' } });
      fireEvent.click(screen.getByRole('button', { name: /save key/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/start with 'sk-ant-'/i);
      });
      expect(onSave).not.toHaveBeenCalled();
    });

    it('shows provider validation stage after format passes', async () => {
      const onSave = vi
        .fn()
        .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
      render(<ApiKeyPrompt {...defaultProps} onSave={onSave} />);

      // Navigate to step 3
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => expect(screen.getByText(/step 2/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => expect(screen.getByText(/step 3/i)).toBeInTheDocument());

      const input = screen.getByLabelText(/api key/i);
      fireEvent.change(input, { target: { value: 'sk-test-key-1234567890' } });
      fireEvent.click(screen.getByRole('button', { name: /save key/i }));

      // Should show provider validation stage
      await waitFor(() => {
        expect(screen.getByText(/Validating with OpenAI/i)).toBeInTheDocument();
      });
    });

    it('shows "Active" status after successful validation', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      render(<ApiKeyPrompt {...defaultProps} onSave={onSave} />);

      // Navigate to step 3
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => expect(screen.getByText(/step 2/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => expect(screen.getByText(/step 3/i)).toBeInTheDocument());

      const input = screen.getByLabelText(/api key/i);
      fireEvent.change(input, { target: { value: 'sk-test-key-1234567890' } });
      fireEvent.click(screen.getByRole('button', { name: /save key/i }));

      await waitFor(() => {
        expect(onSave).toHaveBeenCalled();
      });

      // Should show Active in the stages indicator after provider validation completes
      await waitFor(() => {
        const stageIndicators = screen.getAllByText(/Active/i);
        expect(stageIndicators.length).toBeGreaterThan(0);
      });
    });
  });
});
