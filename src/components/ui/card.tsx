import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }

// 全局动画样式
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes float-slow {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      25% { transform: translateY(-5px) rotate(2deg); }
      50% { transform: translateY(-8px) rotate(0deg); }
      75% { transform: translateY(-3px) rotate(-2deg); }
    }

    @keyframes float-reverse {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      25% { transform: translateY(3px) rotate(-2deg); }
      50% { transform: translateY(8px) rotate(0deg); }
      75% { transform: translateY(5px) rotate(2deg); }
    }

    @keyframes rotate-slow {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes pulse-glow {
      0%, 100% { opacity: 0.3; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(1.05); }
    }

    .animate-float-slow {
      animation: float-slow 8s ease-in-out infinite;
    }

    .animate-float-reverse {
      animation: float-reverse 10s ease-in-out infinite;
    }

    .animate-rotate-slow {
      animation: rotate-slow 20s linear infinite;
    }

    .animate-pulse-glow {
      animation: pulse-glow 6s ease-in-out infinite;
    }

    .animate-delay-1000 {
      animation-delay: 1s;
    }

    .animate-delay-2000 {
      animation-delay: 2s;
    }

    .animate-delay-3000 {
      animation-delay: 3s;
    }
  `;
  document.head.appendChild(style);
}
