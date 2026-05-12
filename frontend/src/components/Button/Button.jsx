import './Button.css';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon = null,
  onClick,
  type = 'button',
  className = '',
  ...props
}) {
  const baseClass = 'btn';
  const variantClass = `btn--${variant}`;
  const sizeClass = `btn--${size}`;
  const disabledClass = disabled ? 'btn--disabled' : '';
  const loadingClass = loading ? 'btn--loading' : '';
  const fullWidthClass = fullWidth ? 'btn--full-width' : '';

  const classes = [
    baseClass,
    variantClass,
    sizeClass,
    disabledClass,
    loadingClass,
    fullWidthClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <span className="btn__spinner"></span>}
      {icon && <span className="btn__icon">{icon}</span>}
      <span className="btn__text">{children}</span>
    </button>
  );
}
