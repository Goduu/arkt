import { useState, useRef, useEffect, forwardRef, InputHTMLAttributes } from 'react';

interface AutoWidthInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'width'> {
    /**
     * Minimum width of the input in pixels
     * @default 20
     */
    minWidth?: number;
    /**
     * Additional CSS class names
     */
    className?: string;
    /**
     * Inline styles for the input
     */
    style?: React.CSSProperties;
}

export const AutoWidthInput = forwardRef<HTMLInputElement, AutoWidthInputProps>(({
    value: controlledValue,
    onChange,
    className = '',
    style = {},
    minWidth = 20,
    ...props
}, ref) => {
    const [internalValue, setInternalValue] = useState<string>(String(controlledValue || ''));
    const [width, setWidth] = useState<number>(0);
    const spanRef = useRef<HTMLSpanElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Use controlled value if provided, otherwise use internal state
    const value = controlledValue !== undefined ? controlledValue : internalValue;

    useEffect(() => {
        if (spanRef.current) {
            // Add a small padding to prevent text from being cut off
            setWidth(spanRef.current.offsetWidth + 2);
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (onChange) {
            onChange(e);
        } else {
            setInternalValue(e.target.value);
        }
    };

    // Forward ref to the actual input element
    useEffect(() => {
        if (ref) {
            if (typeof ref === 'function') {
                ref(inputRef.current);
            } else {
                ref.current = inputRef.current;
            }
        }
    }, [ref]);

    return (
        <div className="relative inline-block px-2">
            {/* Hidden span to measure text width */}
            <span
                ref={spanRef}
                className={`absolute invisible whitespace-pre ${className}`}
                style={{
                    ...style,
                    font: 'inherit',
                }}
            >
                {value || props.placeholder || ' '}
            </span>

            {/* Actual input that matches the measured width */}
            <input
                ref={inputRef}
                {...props}
                value={value}
                onChange={(e) => { handleChange(e); onChange?.(e); }}
                onBlur={(e) => props.onBlur?.(e)}
                className={className}
                style={{
                    ...style,
                    width: `${Math.max(width, minWidth)}px`
                }}
            />
        </div>
    );
});
