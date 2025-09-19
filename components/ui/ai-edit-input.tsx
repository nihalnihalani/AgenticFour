"use client"

import React from "react"
import { cx } from "class-variance-authority"
import { AnimatePresence, motion } from "motion/react"
import { Edit } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface OrbProps {
  dimension?: string
  className?: string
  tones?: {
    base?: string
    accent1?: string
    accent2?: string
    accent3?: string
  }
  spinDuration?: number
}

const ColorOrb: React.FC<OrbProps> = ({
  dimension = "192px",
  className,
  tones,
  spinDuration = 20,
}) => {
  const fallbackTones = {
    base: "oklch(95% 0.02 264.695)",
    accent1: "#facc15", // Yellow 400
    accent2: "#f59e0b", // Amber 500
    accent3: "#fbbf24", // Yellow 300
  }

  const palette = { ...fallbackTones, ...tones }

  const dimValue = parseInt(dimension.replace("px", ""), 10)

  const blurStrength =
    dimValue < 50 ? Math.max(dimValue * 0.008, 1) : Math.max(dimValue * 0.015, 4)

  const contrastStrength =
    dimValue < 50 ? Math.max(dimValue * 0.004, 1.2) : Math.max(dimValue * 0.008, 1.5)

  const pixelDot = dimValue < 50 ? Math.max(dimValue * 0.004, 0.05) : Math.max(dimValue * 0.008, 0.1)

  const shadowRange = dimValue < 50 ? Math.max(dimValue * 0.004, 0.5) : Math.max(dimValue * 0.008, 2)

  const maskRadius =
    dimValue < 30 ? "0%" : dimValue < 50 ? "5%" : dimValue < 100 ? "15%" : "25%"

  const adjustedContrast =
    dimValue < 30 ? 1.1 : dimValue < 50 ? Math.max(contrastStrength * 1.2, 1.3) : contrastStrength

  return (
    <div
      className={cn("color-orb relative", className)}
      style={{
        width: dimension,
        height: dimension,
        "--base": palette.base,
        "--accent1": palette.accent1,
        "--accent2": palette.accent2,
        "--accent3": palette.accent3,
        "--spin-duration": `${spinDuration}s`,
        "--blur": `${blurStrength}px`,
        "--contrast": adjustedContrast,
        "--dot": `${pixelDot}px`,
        "--shadow": `${shadowRange}px`,
        "--mask": maskRadius,
      } as React.CSSProperties}
    >
      <div className="color-orb-gradient" />
      <div className="color-orb-overlay" />
      <style jsx>{`
        @property --angle {
          syntax: "<angle>";
          inherits: false;
          initial-value: 0deg;
        }

        .color-orb {
          display: grid;
          grid-template-areas: "stack";
          overflow: hidden;
          border-radius: 50%;
          position: relative;
          transform: scale(1.1);
        }

        .color-orb-gradient,
        .color-orb-overlay {
          grid-area: stack;
          width: 100%;
          height: 100%;
          border-radius: 50%;
        }

        .color-orb-gradient {
          background:
            conic-gradient(
              from calc(var(--angle) * 2) at 25% 70%,
              var(--accent3),
              transparent 20% 80%,
              var(--accent3)
            ),
            conic-gradient(
              from calc(var(--angle) * 2) at 45% 75%,
              var(--accent2),
              transparent 30% 60%,
              var(--accent2)
            ),
            conic-gradient(
              from calc(var(--angle) * -3) at 80% 20%,
              var(--accent1),
              transparent 40% 60%,
              var(--accent1)
            ),
            conic-gradient(
              from calc(var(--angle) * 2) at 15% 5%,
              var(--accent2),
              transparent 10% 90%,
              var(--accent2)
            ),
            conic-gradient(
              from calc(var(--angle) * 1) at 20% 80%,
              var(--accent1),
              transparent 10% 90%,
              var(--accent1)
            ),
            conic-gradient(
              from calc(var(--angle) * -2) at 85% 10%,
              var(--accent3),
              transparent 20% 80%,
              var(--accent3)
            );
          box-shadow: inset var(--base) 0 0 var(--shadow) calc(var(--shadow) * 0.2);
          filter: blur(var(--blur)) contrast(var(--contrast));
          animation: spin var(--spin-duration) linear infinite;
        }

        .color-orb-overlay {
          background-image: radial-gradient(
            circle at center,
            var(--base) var(--dot),
            transparent var(--dot)
          );
          background-size: calc(var(--dot) * 2) calc(var(--dot) * 2);
          backdrop-filter: blur(calc(var(--blur) * 2)) contrast(calc(var(--contrast) * 2));
          mix-blend-mode: overlay;
        }

        .color-orb[style*="--mask: 0%"] .color-orb-overlay {
          mask-image: none;
        }

        .color-orb:not([style*="--mask: 0%"]) .color-orb-overlay {
          mask-image: radial-gradient(black var(--mask), transparent 75%);
        }

        @keyframes spin {
          to {
            --angle: 360deg;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .color-orb-gradient {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}

const SPEED_FACTOR = 1

interface ContextShape {
  showForm: boolean
  triggerOpen: () => void
  triggerClose: () => void
}

const FormContext = React.createContext({} as ContextShape)
const useFormContext = () => React.useContext(FormContext)

interface MorphPanelProps {
  onSubmit: (prompt: string) => void
  isProcessing?: boolean
}

export function MorphPanel({ onSubmit, isProcessing }: MorphPanelProps) {
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)

  const [showForm, setShowForm] = React.useState(false)
  const [prompt, setPrompt] = React.useState("")

  const triggerClose = React.useCallback(() => {
    setShowForm(false)
    textareaRef.current?.blur()
  }, [])

  const triggerOpen = React.useCallback(() => {
    setShowForm(true)
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 100)
  }, [])

  const handleSuccess = React.useCallback((prompt: string) => {
    onSubmit(prompt)
    setPrompt("")
    triggerClose()
  }, [triggerClose, onSubmit])

  React.useEffect(() => {
    function clickOutsideHandler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node) && showForm) {
        triggerClose()
      }
    }
    document.addEventListener("mousedown", clickOutsideHandler)
    return () => document.removeEventListener("mousedown", clickOutsideHandler)
  }, [showForm, triggerClose])

  const ctx = React.useMemo(
    () => ({ showForm, triggerOpen, triggerClose }),
    [showForm, triggerOpen, triggerClose]
  )

  return (
    <motion.div
      ref={wrapperRef}
      data-panel
      className={cx(
        showForm 
          ? "bg-gray-900/80 backdrop-blur-sm relative flex flex-col items-center overflow-hidden border border-gray-700"
          : "relative inline-flex flex-col items-center overflow-hidden border border-gray-700 hover:bg-gray-800/50 transition-colors cursor-pointer"
      )}
      initial={false}
      animate={{
        width: showForm ? FORM_WIDTH : "auto",
        height: showForm ? FORM_HEIGHT : 44,
        borderRadius: showForm ? 14 : 20,
      }}
      transition={{
        type: "spring",
        stiffness: 550 / SPEED_FACTOR,
        damping: 45,
        mass: 0.7,
        delay: showForm ? 0 : 0.08,
      }}
    >
      <FormContext.Provider value={ctx}>
        {!showForm && <DockBar isProcessing={isProcessing} />}
        {showForm && (
          <InputForm 
            ref={textareaRef} 
            onSuccess={handleSuccess} 
            prompt={prompt}
            setPrompt={setPrompt}
            isProcessing={isProcessing}
          />
        )}
      </FormContext.Provider>
    </motion.div>
  )
}

function DockBar({ isProcessing }: { isProcessing?: boolean }) {
  const { showForm, triggerOpen } = useFormContext()
  return (
    <footer className="mt-auto flex h-[44px] items-center justify-center whitespace-nowrap select-none">
      <div className="flex items-center justify-center gap-2 px-3 max-sm:h-10 max-sm:px-2">
        <div className="flex w-fit items-center gap-2">
          <AnimatePresence mode="wait">
            {showForm ? (
              <motion.div
                key="blank"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0 }}
                exit={{ opacity: 0 }}
                className="h-5 w-5"
              />
            ) : (
              <motion.div
                key="orb"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ColorOrb dimension="24px" tones={{ base: "oklch(22.64% 0 0)" }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Button
          type="button"
          className="flex h-fit flex-1 justify-end rounded-full px-2 !py-0.5"
          variant="ghost"
          onClick={triggerOpen}
          disabled={isProcessing}
        >
          <span className="truncate">Edit image</span>
        </Button>
      </div>
    </footer>
  )
}

const FORM_WIDTH = 480
const FORM_HEIGHT = 200

interface InputFormProps {
  ref: React.Ref<HTMLTextAreaElement>
  onSuccess: (prompt: string) => void
  prompt: string
  setPrompt: (prompt: string) => void
  isProcessing?: boolean
}

function InputForm({ ref, onSuccess, prompt, setPrompt, isProcessing }: InputFormProps) {
  const { triggerClose, showForm } = useFormContext()
  const btnRef = React.useRef<HTMLButtonElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (prompt.trim() && !isProcessing) {
      onSuccess(prompt.trim())
    }
  }

  function handleKeys(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Escape") triggerClose()
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      btnRef.current?.click()
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="absolute bottom-0"
      style={{ width: FORM_WIDTH, height: FORM_HEIGHT, pointerEvents: showForm ? "all" : "none" }}
    >
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 550 / SPEED_FACTOR, damping: 45, mass: 0.7 }}
            className="flex h-full flex-col p-3"
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2 ml-8">
                <Edit className="h-4 w-4 text-gray-400" />
                <p className="text-gray-300 text-sm">
                  Edit image
                </p>
              </div>
              <button
                type="submit"
                ref={btnRef}
                disabled={!prompt.trim() || isProcessing}
                className="text-gray-300 flex items-center justify-center gap-1 rounded-md px-2 py-1 text-sm hover:bg-gray-800 disabled:opacity-50"
              >
                <KeyHint>⌘</KeyHint>
                <KeyHint className="w-fit">Enter</KeyHint>
              </button>
            </div>
            <textarea
              ref={ref}
              placeholder="E.g., Make it more colorful, add more shadows, change background to blue..."
              name="message"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="h-full w-full resize-none scroll-py-2 rounded-md p-3 outline-0 bg-gray-800 text-gray-100 placeholder-gray-500 border border-gray-700 focus:border-yellow-500"
              required
              onKeyDown={handleKeys}
              spellCheck={false}
              disabled={isProcessing}
              autoFocus
            />
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
                <div className="flex items-center gap-2 text-gray-300">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
                  <span>Applying changes...</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute top-3 left-3"
          >
            <ColorOrb dimension="24px" tones={{ base: "oklch(22.64% 0 0)" }} />
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  )
}

function KeyHint({ children, className }: { children: string; className?: string }) {
  return (
    <kbd
      className={cx(
        "text-gray-400 flex h-5 items-center justify-center rounded border border-gray-600 px-1.5 font-mono text-xs",
        className
      )}
    >
      {children}
    </kbd>
  )
}

export default MorphPanel