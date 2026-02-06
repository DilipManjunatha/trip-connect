import type { ReactNode } from 'react';
import { Fragment, useEffect, useRef, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  onAfterClose?: () => void;
  title?: string | ReactNode;
  children: ReactNode;
  className?: string;
  /** Max height as viewport fraction — half-screen slide-up per plan (default 0.55 = 55vh). */
  maxHeightVh?: number;
}

/** When a text field is focused, nudge sheet up by this fraction of viewport so it stays above the keyboard. */
const NUDGE_UP_VH = 35;

/**
 * Bottom sheet per Create/Edit Modal UX Review plan:
 * Slides up from the bottom, fixed max-height ~50–55vh. On first text field focus, nudges up so it stays visible above keyboard.
 */
export default function BottomSheet({
  open,
  onClose,
  onAfterClose,
  title,
  children,
  className,
  maxHeightVh = 0.55,
}: BottomSheetProps) {
  const [nudgeUp, setNudgeUp] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) setNudgeUp(false);
  }, [open]);

  useEffect(() => {
    if (!open || !contentRef.current) return;
    const el = contentRef.current;

    const isFormField = (node: EventTarget | null): node is HTMLInputElement | HTMLTextAreaElement =>
      node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement;

    const onFocusIn = (e: FocusEvent) => {
      if (el.contains(e.target as Node) && isFormField(e.target)) setNudgeUp(true);
    };

    const onFocusOut = (e: FocusEvent) => {
      const next = e.relatedTarget as Node | null;
      if (next && el.contains(next)) return;
      setNudgeUp(false);
    };

    el.addEventListener('focusin', onFocusIn);
    el.addEventListener('focusout', onFocusOut);
    return () => {
      el.removeEventListener('focusin', onFocusIn);
      el.removeEventListener('focusout', onFocusOut);
    };
  }, [open]);

  const panelStyle = {
    maxHeight: `${maxHeightVh * 100}vh`,
    marginBottom: nudgeUp ? `${NUDGE_UP_VH}vh` : 0,
  };

  return (
    <Transition appear show={open} as={Fragment} afterLeave={onAfterClose}>
      <Dialog as="div" className="relative z-[1050]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-0 sm:p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-4"
            >
              <Dialog.Panel
                style={panelStyle}
                className={clsx(
                  'w-full max-w-md overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white text-left align-middle shadow-2xl flex flex-col transition-[margin] duration-200 ease-out',
                  className
                )}
              >
                {(title !== undefined) && (
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
                    <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900 pr-2">
                      {title}
                    </Dialog.Title>
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label="Close"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                )}
                <div ref={contentRef} className="overflow-y-auto flex-1 min-h-0 p-4">
                  {children}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
