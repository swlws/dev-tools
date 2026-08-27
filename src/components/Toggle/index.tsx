interface ToggleProps {
  pressed: boolean
  label: string
  onToggle: (pressed: boolean) => void
}

// Standalone on/off switch for independent options (not mutually exclusive).
// Reuses .view-toggle / .toggle-btn so its height matches Button and ToggleGroup.
export default function Toggle({ pressed, label, onToggle }: ToggleProps) {
  return (
    <div className="view-toggle">
      <button
        type="button"
        aria-pressed={pressed}
        className={`toggle-btn ${pressed ? 'active' : ''}`}
        onClick={() => onToggle(!pressed)}
      >
        {label}
      </button>
    </div>
  )
}
