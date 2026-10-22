import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
children: ReactNode
variant?: 'primary' | 'secondary'
}

function Button({
children,
variant = 'primary',
className = '',
type = 'button',
...props
}: ButtonProps) {
return (
<button
type={type}
className={`button button--${variant} ${className}`.trim()}
{...props}
>
{children} </button>
)
}

export default Button
