"use client"

import { motion, HTMLMotionProps, Variants } from "framer-motion"
import { ReactNode } from "react"

// Fade In Animation
export interface FadeInProps extends Omit<HTMLMotionProps<"div">, "variants" | "initial" | "animate"> {
  children: ReactNode
  delay?: number
  duration?: number
  direction?: "up" | "down" | "left" | "right" | "none"
  distance?: number
}

export function FadeIn({
  children,
  delay = 0,
  duration = 0.5,
  direction = "none",
  distance = 20,
  ...props
}: FadeInProps) {
  const directions = {
    up: { y: distance, x: 0 },
    down: { y: -distance, x: 0 },
    left: { x: distance, y: 0 },
    right: { x: -distance, y: 0 },
    none: { x: 0, y: 0 },
  }

  const variants: Variants = {
    hidden: {
      opacity: 0,
      ...directions[direction],
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94], // easeOutQuad
      },
    },
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Slide In Animation
export interface SlideInProps extends Omit<HTMLMotionProps<"div">, "variants" | "initial" | "animate"> {
  children: ReactNode
  delay?: number
  duration?: number
  direction?: "up" | "down" | "left" | "right"
  distance?: number
}

export function SlideIn({
  children,
  delay = 0,
  duration = 0.4,
  direction = "up",
  distance = 50,
  ...props
}: SlideInProps) {
  const directions = {
    up: { y: distance, x: 0 },
    down: { y: -distance, x: 0 },
    left: { x: distance, y: 0 },
    right: { x: -distance, y: 0 },
  }

  const variants: Variants = {
    hidden: {
      ...directions[direction],
      opacity: 0,
    },
    visible: {
      x: 0,
      y: 0,
      opacity: 1,
      transition: {
        duration,
        delay,
        ease: [0.4, 0, 0.2, 1], // easeInOutCubic
      },
    },
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Stagger Children Animation
export interface StaggerProps extends Omit<HTMLMotionProps<"div">, "variants" | "initial" | "animate"> {
  children: ReactNode
  staggerDelay?: number
  initialDelay?: number
  duration?: number
}

export function Stagger({
  children,
  staggerDelay = 0.1,
  initialDelay = 0,
  duration = 0.4,
  ...props
}: StaggerProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: initialDelay,
        staggerChildren: staggerDelay,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      {...props}
    >
      {Array.isArray(children) ? (
        children.map((child, index) => (
          <motion.div key={index} variants={itemVariants}>
            {child}
          </motion.div>
        ))
      ) : (
        <motion.div variants={itemVariants}>{children}</motion.div>
      )}
    </motion.div>
  )
}

// Scale In Animation
export interface ScaleInProps extends Omit<HTMLMotionProps<"div">, "variants" | "initial" | "animate"> {
  children: ReactNode
  delay?: number
  duration?: number
  initialScale?: number
}

export function ScaleIn({
  children,
  delay = 0,
  duration = 0.4,
  initialScale = 0.8,
  ...props
}: ScaleInProps) {
  const variants: Variants = {
    hidden: {
      scale: initialScale,
      opacity: 0,
    },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration,
        delay,
        ease: [0.34, 1.56, 0.64, 1], // easeOutBack
      },
    },
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Count Up Animation for Numbers
export interface CountUpProps extends Omit<HTMLMotionProps<"span">, "animate"> {
  from?: number
  to: number
  duration?: number
  delay?: number
  decimals?: number
  prefix?: string
  suffix?: string
}

export function CountUp({
  from = 0,
  to,
  duration = 1,
  delay = 0,
  decimals = 0,
  prefix = "",
  suffix = "",
  ...props
}: CountUpProps) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay }}
      {...props}
    >
      <motion.span
        initial={from}
        animate={to}
        transition={{
          duration,
          delay,
          ease: [0.22, 1, 0.36, 1], // easeOutExpo
        }}
        onUpdate={(latest) => {
          if (props.children && typeof props.children === "function") {
            return
          }
        }}
      >
        {(value: number) =>
          `${prefix}${value.toFixed(decimals)}${suffix}`
        }
      </motion.span>
    </motion.span>
  )
}

// Hover Scale Effect (for buttons, cards, etc.)
export interface HoverScaleProps extends HTMLMotionProps<"div"> {
  children: ReactNode
  scale?: number
  duration?: number
}

export function HoverScale({
  children,
  scale = 1.05,
  duration = 0.2,
  ...props
}: HoverScaleProps) {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration, ease: "easeInOut" }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Shake Animation (for errors)
export interface ShakeProps extends Omit<HTMLMotionProps<"div">, "animate"> {
  children: ReactNode
  trigger?: boolean
  duration?: number
  intensity?: number
}

export function Shake({
  children,
  trigger = false,
  duration = 0.5,
  intensity = 10,
  ...props
}: ShakeProps) {
  return (
    <motion.div
      animate={
        trigger
          ? {
              x: [-intensity, intensity, -intensity, intensity, 0],
              transition: { duration },
            }
          : {}
      }
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Pulse Animation (for notifications, highlights)
export interface PulseProps extends HTMLMotionProps<"div"> {
  children: ReactNode
  scale?: number
  duration?: number
}

export function Pulse({
  children,
  scale = 1.05,
  duration = 1,
  ...props
}: PulseProps) {
  return (
    <motion.div
      animate={{
        scale: [1, scale, 1],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Presence wrapper for exit animations
export { AnimatePresence } from "framer-motion"
