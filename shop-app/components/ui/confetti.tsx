"use client";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import type {
  GlobalOptions as ConfettiGlobalOptions,
  CreateTypes as ConfettiInstance,
  Options as ConfettiOptions,
} from "canvas-confetti";
import confetti from "canvas-confetti";

type Api = { fire: (options?: ConfettiOptions) => void };

export type ConfettiRef = Api | null;

type Props = React.ComponentPropsWithoutRef<"canvas"> & {
  options?: ConfettiOptions;
  globalOptions?: ConfettiGlobalOptions;
  manualstart?: boolean;
};

export const Confetti = forwardRef<ConfettiRef, Props>(function Confetti(
  {
    options,
    globalOptions = { resize: true, useWorker: true },
    manualstart = false,
    ...rest
  },
  ref,
) {
  const instanceRef = useRef<ConfettiInstance | null>(null);

  const canvasRef = useCallback(
    (node: HTMLCanvasElement | null) => {
      if (node !== null) {
        if (instanceRef.current) return;
        instanceRef.current = confetti.create(node, {
          ...globalOptions,
          resize: true,
        });
      } else if (instanceRef.current) {
        instanceRef.current.reset();
        instanceRef.current = null;
      }
    },
    [globalOptions],
  );

  const fire = useCallback(
    (opts: ConfettiOptions = {}) =>
      void instanceRef.current?.({ ...options, ...opts }),
    [options],
  );

  const api = useMemo(() => ({ fire }), [fire]);
  useImperativeHandle(ref, () => api, [api]);

  useEffect(() => {
    if (!manualstart) fire();
  }, [manualstart, fire]);

  return <canvas ref={canvasRef} {...rest} />;
});

/** Two cannons from the bottom corners — the celebration used on success. */
export function fireSideCannons(api: ConfettiRef) {
  if (!api) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const defaults = { startVelocity: 32, spread: 360, ticks: 70, zIndex: 100 };
  const colors = ["#C85478", "#E8A4B5", "#E3B664", "#A03D5E", "#FFF8F2"];
  api.fire({ ...defaults, colors, particleCount: 55, origin: { x: 0, y: 1 }, angle: 60 });
  api.fire({ ...defaults, colors, particleCount: 55, origin: { x: 1, y: 1 }, angle: 120 });
}
