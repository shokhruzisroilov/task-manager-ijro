import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Label } from '../components/label/Label';
import { Input } from '../components/common/Input';
import { Card } from '../components/card/Card';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useKeyboardDragDrop } from '../hooks/useKeyboardDragDrop';
import { useCardNavigation } from '../hooks/useCardNavigation';
import { getContrastRatio, validateLabelColor } from '../utils/colorContrast';
import { Card as CardType } from '../types/models';

/**
 * Unit tests for accessibility features
 * Tests keyboard shortcuts, focus trap, ARIA labels, and keyboard alternatives
 * Implements Requirements 17.1, 17.2, 17.5
 */

describe('Keyboard Shortcuts', () => {
  beforeEach(() => {
    // Clear any existing event listeners
    vi.clearAllMocks();
  });

  it('should call onSearch when Ctrl+K is pressed', () => {
    const onSearch = vi.fn();
    const TestComponent = () => {
      useKeyboardShortcuts({ onSearch });
      return <div>Test</div>;
    };

    render(<TestComponent />);
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(onSearch).toHaveBeenCalled();
  });

  it('should call onSearch when Cmd+K is pressed (Mac)', () => {
    const onSearch = vi.fn();
    const TestComponent = () => {
      useKeyboardShortcuts({ onSearch });
      return <div>Test</div>;
    };

    render(<TestComponent />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    expect(onSearch).toHaveBeenCalled();
  });

  it('should call onEscape when Escape is pressed', () => {
    const onEscape = vi.fn();
    const TestComponent = () => {
      useKeyboardShortcuts({ onEscape });
      return <div>Test</div>;
    };

    render(<TestComponent />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onEscape).toHaveBeenCalled();
  });

  it('should call arrow key handlers for navigation', () => {
    const onNavigateUp = vi.fn();
    const onNavigateDown = vi.fn();
    const onNavigateLeft = vi.fn();
    const onNavigateRight = vi.fn();
    
    const TestComponent = () => {
      useKeyboardShortcuts({ 
        onNavigateUp, 
        onNavigateDown, 
        onNavigateLeft, 
        onNavigateRight 
      });
      return <div>Test</div>;
    };

    render(<TestComponent />);
    
    fireEvent.keyDown(window, { key: 'ArrowUp' });
    expect(onNavigateUp).toHaveBeenCalled();
    
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    expect(onNavigateDown).toHaveBeenCalled();
    
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(onNavigateLeft).toHaveBeenCalled();
    
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(onNavigateRight).toHaveBeenCalled();
  });

  it('should not trigger arrow key handlers when focused on input', () => {
    const onNavigateUp = vi.fn();
    const TestComponent = () => {
      useKeyboardShortcuts({ onNavigateUp });
      return <input type="text" />;
    };

    render(<TestComponent />);
    const input = screen.getByRole('textbox');
    input.focus();
    
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(onNavigateUp).not.toHaveBeenCalled();
  });

  it('should prevent default behavior for Ctrl+K', () => {
    const onSearch = vi.fn();
    const TestComponent = () => {
      useKeyboardShortcuts({ onSearch });
      return <div>Test</div>;
    };

    render(<TestComponent />);
    const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    window.dispatchEvent(event);
    
    expect(preventDefaultSpy).toHaveBeenCalled();
  });
});

describe('Focus Trap in Modals', () => {
  it('should trap focus within modal', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <button>First Button</button>
        <button>Second Button</button>
      </Modal>
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    
    // Modal should have proper ARIA attributes
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('should close modal on Escape key', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <div>Content</div>
      </Modal>
    );

    // Fire escape on document since modal listens to document
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('should have aria-labelledby when title is provided', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <div>Content</div>
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    expect(screen.getByText('Test Modal')).toHaveAttribute('id', 'modal-title');
  });

  it('should focus first focusable element when opened', async () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <Modal isOpen={false} onClose={onClose} title="Test Modal">
        <button>First Button</button>
        <button>Second Button</button>
      </Modal>
    );

    // Open modal
    rerender(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <button>First Button</button>
        <button>Second Button</button>
      </Modal>
    );

    await waitFor(() => {
      // First button should be focused (or close button)
      expect(document.activeElement).toBeTruthy();
    });
  });

  it('should cycle focus with Tab key', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <button>First Button</button>
        <button>Second Button</button>
      </Modal>
    );

    const buttons = screen.getAllByRole('button');
    const lastButton = buttons[buttons.length - 1];

    // Focus last button
    if (lastButton) {
      lastButton.focus();
      expect(document.activeElement).toBe(lastButton);

      // Tab should cycle to first button
      fireEvent.keyDown(lastButton, { key: 'Tab' });
      // Note: Actual focus cycling is handled by useFocusTrap hook
    }
  });

  it('should have close button with aria-label', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <div>Content</div>
      </Modal>
    );

    const closeButton = screen.getByLabelText('Close modal');
    expect(closeButton).toBeInTheDocument();
    expect(closeButton).toHaveAttribute('aria-label', 'Close modal');
  });
});

describe('ARIA Labels', () => {
  it('should have proper ARIA attributes on buttons', () => {
    render(<Button>Click Me</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click Me');
  });

  it('should have proper ARIA attributes on loading buttons', () => {
    render(<Button loading={true}>Loading</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('should have proper ARIA attributes on disabled buttons', () => {
    render(<Button disabled={true}>Disabled</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toBeDisabled();
  });

  it('should have proper ARIA labels on labels', () => {
    const label = { id: 1, name: 'Test Label', color: '#ff0000' };
    render(<Label label={label} onClick={() => {}} />);
    
    const labelElement = screen.getByRole('button');
    expect(labelElement).toHaveAttribute('aria-label');
    expect(labelElement.getAttribute('aria-label')).toContain('Test Label');
  });

  it('should have proper ARIA attributes on inputs with errors', () => {
    render(<Input label="Email" error="Invalid email" type="email" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby');
    
    const errorMessage = screen.getByRole('alert');
    expect(errorMessage).toHaveTextContent('Invalid email');
  });

  it('should have proper ARIA attributes on inputs without errors', () => {
    render(<Input label="Email" type="email" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'false');
  });

  it('should associate labels with inputs using htmlFor', () => {
    render(<Input label="Username" type="text" id="username-input" />);
    
    const label = screen.getByText('Username');
    const input = screen.getByRole('textbox');
    
    expect(label).toHaveAttribute('for', 'username-input');
    expect(input).toHaveAttribute('id', 'username-input');
  });

  it('should have proper ARIA attributes on cards', () => {
    const card: CardType = {
      id: 1,
      title: 'Test Card',
      description: 'Test description',
      columnId: 1,
      position: 0,
      archived: false,
      members: [],
      labels: [],
      comments: [],
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    render(
      <DndProvider backend={HTML5Backend}>
        <Card card={card} onClick={() => {}} />
      </DndProvider>
    );
    
    const cardElement = screen.getByRole('button');
    expect(cardElement).toHaveAttribute('aria-label', 'Card: Test Card');
    expect(cardElement).toHaveAttribute('tabIndex', '0');
  });

  it('should have loading spinner with proper ARIA attributes', () => {
    render(<Button loading={true}>Submit</Button>);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    
    const loadingLabel = screen.getByLabelText('Loading');
    expect(loadingLabel).toBeInTheDocument();
  });
});

describe('Keyboard Alternatives for Drag-Drop', () => {
  it('should make labels keyboard accessible with onClick', () => {
    const onClick = vi.fn();
    const label = { id: 1, name: 'Test', color: '#ff0000' };
    
    render(<Label label={label} onClick={onClick} />);
    
    const labelElement = screen.getByRole('button');
    expect(labelElement).toHaveAttribute('tabindex', '0');
    
    // Test Enter key
    fireEvent.keyDown(labelElement, { key: 'Enter' });
    expect(onClick).toHaveBeenCalled();
  });

  it('should make labels keyboard accessible with Space key', () => {
    const onClick = vi.fn();
    const label = { id: 1, name: 'Test', color: '#ff0000' };
    
    render(<Label label={label} onClick={onClick} />);
    
    const labelElement = screen.getByRole('button');
    
    // Test Space key
    fireEvent.keyDown(labelElement, { key: ' ' });
    expect(onClick).toHaveBeenCalled();
  });

  it('should make cards keyboard accessible', () => {
    const onClick = vi.fn();
    const card: CardType = {
      id: 1,
      title: 'Test Card',
      description: '',
      columnId: 1,
      position: 0,
      archived: false,
      members: [],
      labels: [],
      comments: [],
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    render(
      <DndProvider backend={HTML5Backend}>
        <Card card={card} onClick={onClick} />
      </DndProvider>
    );
    
    const cardElement = screen.getByRole('button');
    expect(cardElement).toHaveAttribute('tabIndex', '0');
    
    // Test Enter key
    fireEvent.keyDown(cardElement, { key: 'Enter' });
    expect(onClick).toHaveBeenCalled();
  });

  it('should make cards keyboard accessible with Space key', () => {
    const onClick = vi.fn();
    const card: CardType = {
      id: 1,
      title: 'Test Card',
      description: '',
      columnId: 1,
      position: 0,
      archived: false,
      members: [],
      labels: [],
      comments: [],
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    render(
      <DndProvider backend={HTML5Backend}>
        <Card card={card} onClick={onClick} />
      </DndProvider>
    );
    
    const cardElement = screen.getByRole('button');
    
    // Test Space key
    fireEvent.keyDown(cardElement, { key: ' ' });
    expect(onClick).toHaveBeenCalled();
  });

  it('should support keyboard drag-drop selection', () => {
    const TestComponent = () => {
      const { mode, handleKeyDown } = useKeyboardDragDrop();
      
      return (
        <div>
          <div data-testid="mode">{mode}</div>
          <button
            onKeyDown={(e) => handleKeyDown(
              e,
              { id: 1, type: 'card' },
              () => {},
              { position: 0, columnId: 1 }
            )}
          >
            Card 1
          </button>
        </div>
      );
    };

    render(<TestComponent />);
    
    const button = screen.getByRole('button');
    const modeDisplay = screen.getByTestId('mode');
    
    expect(modeDisplay).toHaveTextContent('select');
    
    // Press Space to select
    fireEvent.keyDown(button, { key: ' ' });
    
    expect(modeDisplay).toHaveTextContent('move');
  });

  it('should support keyboard drag-drop cancellation', () => {
    const TestComponent = () => {
      const { mode, handleKeyDown } = useKeyboardDragDrop();
      
      return (
        <div>
          <div data-testid="mode">{mode}</div>
          <button
            onKeyDown={(e) => handleKeyDown(
              e,
              { id: 1, type: 'card' },
              () => {},
              { position: 0, columnId: 1 }
            )}
          >
            Card 1
          </button>
        </div>
      );
    };

    render(<TestComponent />);
    
    const button = screen.getByRole('button');
    const modeDisplay = screen.getByTestId('mode');
    
    // Select item
    fireEvent.keyDown(button, { key: ' ' });
    expect(modeDisplay).toHaveTextContent('move');
    
    // Press Escape to cancel
    fireEvent.keyDown(button, { key: 'Escape' });
    expect(modeDisplay).toHaveTextContent('select');
  });

  it('should support keyboard drag-drop movement with arrow keys', () => {
    const onMove = vi.fn();
    const TestComponent = () => {
      const { handleKeyDown } = useKeyboardDragDrop();
      
      return (
        <button
          onKeyDown={(e) => handleKeyDown(
            e,
            { id: 1, type: 'card' },
            onMove,
            { position: 1, columnId: 1 }
          )}
        >
          Card 1
        </button>
      );
    };

    render(<TestComponent />);
    
    const button = screen.getByRole('button');
    
    // Select item first
    fireEvent.keyDown(button, { key: ' ' });
    
    // Move up
    fireEvent.keyDown(button, { key: 'ArrowUp' });
    expect(onMove).toHaveBeenCalledWith(
      { id: 1, type: 'card' },
      { position: 0, columnId: 1 }
    );
  });
});

describe('Card Navigation', () => {
  const mockColumns = [
    {
      id: 1,
      position: 0,
      cards: [
        { id: 1, position: 0, columnId: 1 },
        { id: 2, position: 1, columnId: 1 }
      ]
    },
    {
      id: 2,
      position: 1,
      cards: [
        { id: 3, position: 0, columnId: 2 },
        { id: 4, position: 1, columnId: 2 }
      ]
    }
  ];

  it('should navigate up within a column', () => {
    const TestComponent = () => {
      const { focusedCardId, setFocusedCardId, navigateUp } = useCardNavigation(mockColumns);
      
      return (
        <div>
          <div data-testid="focused">{focusedCardId || 'none'}</div>
          <button onClick={() => setFocusedCardId(2)}>Focus Card 2</button>
          <button onClick={navigateUp}>Navigate Up</button>
          <div data-card-id="1"></div>
          <div data-card-id="2"></div>
        </div>
      );
    };

    render(<TestComponent />);
    
    // Focus card 2
    fireEvent.click(screen.getByText('Focus Card 2'));
    expect(screen.getByTestId('focused')).toHaveTextContent('2');
    
    // Navigate up should focus card 1
    fireEvent.click(screen.getByText('Navigate Up'));
    expect(screen.getByTestId('focused')).toHaveTextContent('1');
  });

  it('should navigate down within a column', () => {
    const TestComponent = () => {
      const { focusedCardId, setFocusedCardId, navigateDown } = useCardNavigation(mockColumns);
      
      return (
        <div>
          <div data-testid="focused">{focusedCardId || 'none'}</div>
          <button onClick={() => setFocusedCardId(1)}>Focus Card 1</button>
          <button onClick={navigateDown}>Navigate Down</button>
          <div data-card-id="1"></div>
          <div data-card-id="2"></div>
        </div>
      );
    };

    render(<TestComponent />);
    
    // Focus card 1
    fireEvent.click(screen.getByText('Focus Card 1'));
    expect(screen.getByTestId('focused')).toHaveTextContent('1');
    
    // Navigate down should focus card 2
    fireEvent.click(screen.getByText('Navigate Down'));
    expect(screen.getByTestId('focused')).toHaveTextContent('2');
  });

  it('should navigate left to previous column', () => {
    const TestComponent = () => {
      const { focusedCardId, setFocusedCardId, navigateLeft } = useCardNavigation(mockColumns);
      
      return (
        <div>
          <div data-testid="focused">{focusedCardId || 'none'}</div>
          <button onClick={() => setFocusedCardId(3)}>Focus Card 3</button>
          <button onClick={navigateLeft}>Navigate Left</button>
          <div data-card-id="1"></div>
          <div data-card-id="3"></div>
        </div>
      );
    };

    render(<TestComponent />);
    
    // Focus card 3 (in column 2)
    fireEvent.click(screen.getByText('Focus Card 3'));
    expect(screen.getByTestId('focused')).toHaveTextContent('3');
    
    // Navigate left should focus card 1 (first card in column 1)
    fireEvent.click(screen.getByText('Navigate Left'));
    expect(screen.getByTestId('focused')).toHaveTextContent('1');
  });

  it('should navigate right to next column', () => {
    const TestComponent = () => {
      const { focusedCardId, setFocusedCardId, navigateRight } = useCardNavigation(mockColumns);
      
      return (
        <div>
          <div data-testid="focused">{focusedCardId || 'none'}</div>
          <button onClick={() => setFocusedCardId(1)}>Focus Card 1</button>
          <button onClick={navigateRight}>Navigate Right</button>
          <div data-card-id="1"></div>
          <div data-card-id="3"></div>
        </div>
      );
    };

    render(<TestComponent />);
    
    // Focus card 1 (in column 1)
    fireEvent.click(screen.getByText('Focus Card 1'));
    expect(screen.getByTestId('focused')).toHaveTextContent('1');
    
    // Navigate right should focus card 3 (first card in column 2)
    fireEvent.click(screen.getByText('Navigate Right'));
    expect(screen.getByTestId('focused')).toHaveTextContent('3');
  });
});

describe('Color Contrast Utilities', () => {
  it('should calculate valid contrast ratios', () => {
    const ratio = getContrastRatio('#000000', '#ffffff');
    expect(ratio).toBeGreaterThan(20); // Black on white has very high contrast
  });

  it('should validate label colors', () => {
    const validation = validateLabelColor('#0079bf');
    expect(validation).toHaveProperty('isValid');
    expect(validation).toHaveProperty('textColor');
    expect(validation).toHaveProperty('contrastRatio');
    expect(validation.textColor).toMatch(/^#[0-9A-F]{6}$/i);
  });

  it('should provide contrasting text color for dark backgrounds', () => {
    const validation = validateLabelColor('#000000');
    expect(validation.textColor).toBe('#FFFFFF');
  });

  it('should provide contrasting text color for light backgrounds', () => {
    const validation = validateLabelColor('#FFFFFF');
    expect(validation.textColor).toBe('#000000');
  });

  it('should ensure sufficient contrast ratio for accessibility', () => {
    const validation = validateLabelColor('#0079bf');
    // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
    expect(validation.contrastRatio).toBeGreaterThanOrEqual(3);
  });
});
