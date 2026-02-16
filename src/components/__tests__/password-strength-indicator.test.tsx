import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PasswordStrengthIndicator } from '../password-strength-indicator';

describe('PasswordStrengthIndicator', () => {
  it('renders nothing for empty password', () => {
    const { container } = render(<PasswordStrengthIndicator password="" />);
    expect(container.firstChild).toBeNull();
  });

  it('shows "Weak" for short passwords', () => {
    render(<PasswordStrengthIndicator password="abc" />);
    expect(screen.getByText('Weak')).toBeInTheDocument();
  });

  it('shows "Weak" for passwords with only lowercase letters', () => {
    render(<PasswordStrengthIndicator password="abcdefgh" />);
    expect(screen.getByText('Weak')).toBeInTheDocument();
  });

  it('shows "Weak" for passwords with only one character type', () => {
    render(<PasswordStrengthIndicator password="ABCDEFGH" />);
    expect(screen.getByText('Weak')).toBeInTheDocument();
  });

  it('shows "Fair" for passwords with 8+ chars and 3 requirements met', () => {
    render(<PasswordStrengthIndicator password="Abcdefgh" />);
    expect(screen.getByText('Fair')).toBeInTheDocument();
  });

  it('shows "Fair" for passwords with uppercase, lowercase, and numbers', () => {
    render(<PasswordStrengthIndicator password="Abcdefg1" />);
    expect(screen.getByText('Fair')).toBeInTheDocument();
  });

  it('shows "Strong" for passwords meeting all 5 requirements', () => {
    render(<PasswordStrengthIndicator password="Abcd123!" />);
    expect(screen.getByText('Strong')).toBeInTheDocument();
  });

  it('shows all requirement items', () => {
    render(<PasswordStrengthIndicator password="Abcd123!" />);
    expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
    expect(screen.getByText('Uppercase letter')).toBeInTheDocument();
    expect(screen.getByText('Lowercase letter')).toBeInTheDocument();
    expect(screen.getByText('Number')).toBeInTheDocument();
    expect(screen.getByText('Special character')).toBeInTheDocument();
  });

  it('marks met requirements correctly', () => {
    render(<PasswordStrengthIndicator password="Abcd123!" />);
    const requirements = [
      'At least 8 characters',
      'Uppercase letter',
      'Lowercase letter',
      'Number',
      'Special character',
    ];
    requirements.forEach((req) => {
      const element = screen.getByText(req);
      expect(element).toHaveClass('text-accent-success');
    });
  });

  it('marks unmet requirements correctly', () => {
    render(<PasswordStrengthIndicator password="abc" />);
    const unmetRequirements = [
      'At least 8 characters',
      'Uppercase letter',
      'Number',
      'Special character',
    ];
    unmetRequirements.forEach((req) => {
      const element = screen.getByText(req);
      expect(element).toHaveClass('text-muted-foreground');
    });
  });

  it('shows correct strength for password with special characters', () => {
    render(<PasswordStrengthIndicator password="P@ssw0rd!" />);
    expect(screen.getByText('Strong')).toBeInTheDocument();
  });

  it('shows weak for password without enough variety', () => {
    render(<PasswordStrengthIndicator password="12345678" />);
    expect(screen.getByText('Weak')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <PasswordStrengthIndicator password="test" className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('shows fair for password with 4 requirements met', () => {
    render(<PasswordStrengthIndicator password="Abcdefg1" />);
    expect(screen.getByText('Fair')).toBeInTheDocument();
    expect(screen.getByText('At least 8 characters')).toHaveClass('text-accent-success');
    expect(screen.getByText('Uppercase letter')).toHaveClass('text-accent-success');
    expect(screen.getByText('Lowercase letter')).toHaveClass('text-accent-success');
    expect(screen.getByText('Number')).toHaveClass('text-accent-success');
    expect(screen.getByText('Special character')).toHaveClass('text-muted-foreground');
  });

  it('correctly identifies special characters in various forms', () => {
    const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'];
    specialChars.forEach((char) => {
      const { unmount } = render(<PasswordStrengthIndicator password={`Abc123${char}x`} />);
      expect(screen.getByText('Strong')).toBeInTheDocument();
      unmount();
    });
  });

  it('handles very long passwords correctly', () => {
    const longPassword = 'Abcd1234!'.repeat(10);
    render(<PasswordStrengthIndicator password={longPassword} />);
    expect(screen.getByText('Strong')).toBeInTheDocument();
  });

  it('shows weak for password just at minimum length with one type', () => {
    render(<PasswordStrengthIndicator password="abcdefgh" />);
    expect(screen.getByText('Weak')).toBeInTheDocument();
    expect(screen.getByText('At least 8 characters')).toHaveClass('text-accent-success');
    expect(screen.getByText('Lowercase letter')).toHaveClass('text-accent-success');
  });
});
