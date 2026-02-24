'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { WalkthroughStep } from './types';

const STORAGE_KEY = 'signalcore_walkthrough_seen';
const EVENT_NAME = 'signalcore:start-walkthrough';

const STEPS: WalkthroughStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to SignalCore',
    description:
      'A vendor research tool that programmatically evaluates LLM observability platforms.',
    target: null,
  },
  {
    id: 'research-panel',
    title: 'Run Research',
    description:
      "Click 'Run Research' to trigger the agentic pipeline. It fetches real vendor docs and GitHub repos, then analyzes them against your requirements.",
    target: 'research-panel',
  },
  {
    id: 'comparison-matrix',
    title: 'Comparison Matrix',
    description:
      'Scores update after research completes. Click any cell to see the evidence behind the score.',
    target: 'comparison-matrix',
  },
  {
    id: 'priority-sliders',
    title: 'Priority Weights',
    description:
      'Adjust requirement weights to match your priorities. Scores recalculate in real-time.',
    target: 'priority-sliders',
  },
  {
    id: 'done',
    title: "You're all set!",
    description:
      'Run a research scan to see SignalCore in action.',
    target: null,
  },
];

const SPOTLIGHT_PADDING = 12;
const SPOTLIGHT_RADIUS = 12;

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function getTargetRect(target: string): SpotlightRect | null {
  const el = document.querySelector(`[data-walkthrough="${target}"]`);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return {
    top: rect.top - SPOTLIGHT_PADDING,
    left: rect.left - SPOTLIGHT_PADDING,
    width: rect.width + SPOTLIGHT_PADDING * 2,
    height: rect.height + SPOTLIGHT_PADDING * 2,
  };
}

function getCardPosition(spotlight: SpotlightRect | null): React.CSSProperties {
  if (!spotlight) {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    };
  }

  const cardWidth = 380;
  const cardEstimatedHeight = 180;
  const gap = 16;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const belowTop = spotlight.top + spotlight.height + gap;
  const aboveTop = spotlight.top - cardEstimatedHeight - gap;

  let top: number;
  if (belowTop + cardEstimatedHeight < vh) {
    top = belowTop;
  } else if (aboveTop > 0) {
    top = aboveTop;
  } else {
    top = Math.max(gap, spotlight.top);
  }

  let left = spotlight.left + spotlight.width / 2 - cardWidth / 2;
  left = Math.max(gap, Math.min(left, vw - cardWidth - gap));

  return { top, left, width: cardWidth };
}

export function Walkthrough() {
  const [active, setActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);

  const step = useMemo(() => STEPS[currentStep], [currentStep]);

  const dismiss = useCallback(() => {
    setActive(false);
    setCurrentStep(0);
    setSpotlight(null);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
  }, []);

  const start = useCallback(() => {
    setCurrentStep(0);
    setSpotlight(null);
    setActive(true);
  }, []);

  // auto-show on first visit
  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        // small delay so the page renders first
        const timer = setTimeout(() => setActive(true), 600);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore
    }
  }, []);

  // listen for custom event from header help button
  useEffect(() => {
    const handler = () => start();
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, [start]);

  // update spotlight rect when step changes or on resize
  useEffect(() => {
    if (!active) return;

    function update() {
      const target = STEPS[currentStep]?.target;
      if (!target) {
        setSpotlight(null);
        return;
      }

      // scroll target into view first
      const el = document.querySelector(`[data-walkthrough="${target}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // wait for scroll to settle before measuring
        requestAnimationFrame(() => {
          setTimeout(() => {
            setSpotlight(getTargetRect(target));
          }, 350);
        });
      } else {
        setSpotlight(null);
      }
    }

    update();

    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [active, currentStep]);

  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      dismiss();
    }
  }, [currentStep, dismiss]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const cardStyle = useMemo(
    () => getCardPosition(spotlight),
    [spotlight]
  );

  if (!active) return null;

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="walkthrough-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[9999]"
        >
          {/* Dark overlay — solid when no spotlight, box-shadow cutout when spotlight */}
          {spotlight ? (
            <motion.div
              key={`spotlight-${step.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="absolute pointer-events-none"
              style={{
                top: spotlight.top,
                left: spotlight.left,
                width: spotlight.width,
                height: spotlight.height,
                borderRadius: SPOTLIGHT_RADIUS,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.7)',
              }}
            />
          ) : (
            <div className="absolute inset-0 bg-black/70" />
          )}

          {/* Card */}
          <motion.div
            key={`card-${step.id}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="absolute z-[2] rounded-xl border border-border bg-card p-6 shadow-2xl"
            style={cardStyle}
          >
            {/* Step counter */}
            <p className="text-xs font-medium text-muted-foreground mb-2">
              {currentStep + 1} of {STEPS.length}
            </p>

            {/* Content */}
            <h3 className="text-base font-semibold text-foreground mb-1.5">
              {step.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              {step.description}
            </p>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={dismiss}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Skip tour
              </button>
              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="cursor-pointer"
                  >
                    Back
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleNext}
                  className="cursor-pointer"
                >
                  {currentStep < STEPS.length - 1 ? 'Next' : 'Get Started'}
                </Button>
              </div>
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-1.5 mt-4">
              {STEPS.map((s, i) => (
                <div
                  key={s.id}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    i === currentStep
                      ? 'w-4 bg-primary'
                      : 'w-1.5 bg-muted-foreground/30'
                  )}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
