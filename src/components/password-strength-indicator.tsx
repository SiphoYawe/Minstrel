import { Check, Minus } from 'lucide-react';

export type PasswordStrength = 'weak' | 'fair' | 'strong' | 'empty';

interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

function calculateStrength(password: string): {
  strength: PasswordStrength;
  requirements: PasswordRequirements;
} {
  if (password.length === 0) {
    return {
      strength: 'empty',
      requirements: {
        minLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecial: false,
      },
    };
  }

  const requirements: PasswordRequirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  const metCount = Object.values(requirements).filter(Boolean).length;

  // Strong: all 5 requirements met
  if (metCount === 5) {
    return { strength: 'strong', requirements };
  }

  // Fair: 3-4 requirements met
  if (metCount >= 3) {
    return { strength: 'fair', requirements };
  }

  // Weak: 1-2 requirements met
  return { strength: 'weak', requirements };
}

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export function PasswordStrengthIndicator({
  password,
  className = '',
}: PasswordStrengthIndicatorProps) {
  const { strength, requirements } = calculateStrength(password);

  if (strength === 'empty') {
    return null;
  }

  const strengthConfig = {
    weak: {
      label: 'Weak',
      color: 'bg-accent-warm',
      segments: 1,
    },
    fair: {
      label: 'Fair',
      color: 'bg-primary',
      segments: 2,
    },
    strong: {
      label: 'Strong',
      color: 'bg-accent-success',
      segments: 3,
    },
  };

  const config = strengthConfig[strength];

  return (
    <div className={className}>
      {/* Strength bar */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {[1, 2, 3].map((segment) => (
            <div
              key={segment}
              className={`h-1 flex-1 ${
                segment <= config.segments ? config.color : 'bg-surface-border'
              }`}
            />
          ))}
        </div>
        <span
          className={`font-mono text-[11px] uppercase tracking-wider ${config.color.replace('bg-', 'text-')}`}
        >
          {config.label}
        </span>
      </div>

      {/* Requirements checklist */}
      <div className="space-y-1">
        <RequirementItem met={requirements.minLength}>At least 8 characters</RequirementItem>
        <RequirementItem met={requirements.hasUppercase}>Uppercase letter</RequirementItem>
        <RequirementItem met={requirements.hasLowercase}>Lowercase letter</RequirementItem>
        <RequirementItem met={requirements.hasNumber}>Number</RequirementItem>
        <RequirementItem met={requirements.hasSpecial}>Special character</RequirementItem>
      </div>
    </div>
  );
}

interface RequirementItemProps {
  met: boolean;
  children: React.ReactNode;
}

function RequirementItem({ met, children }: RequirementItemProps) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <Check className="size-3 text-accent-success" strokeWidth={2.5} />
      ) : (
        <Minus className="size-3 text-muted-foreground" strokeWidth={2.5} />
      )}
      <span
        className={`font-mono text-[11px] ${met ? 'text-accent-success' : 'text-muted-foreground'}`}
      >
        {children}
      </span>
    </div>
  );
}
