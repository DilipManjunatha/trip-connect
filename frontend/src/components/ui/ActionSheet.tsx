import type { ReactNode } from 'react';
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { clsx } from 'clsx';

export interface ActionSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string | ReactNode;
  children: ReactNode;
  className?: string;
}

export default function ActionSheet({
  open,
  onClose,
  title,
  children,
  className,
}: ActionSheetProps) {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
          <div className="flex min-h-full items-end justify-center p-4 text-center">
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
                className={clsx(
                  'w-full max-w-md overflow-hidden rounded-2xl bg-white text-left align-middle shadow-2xl mx-auto',
                  className
                )}
              >
                {title ? (
                  <div className="px-5 pt-4 pb-2 text-center">
                    <Dialog.Title className="text-sm font-semibold text-gray-600">
                      {title}
                    </Dialog.Title>
                  </div>
                ) : null}

                <div className="px-2 pb-2 [&_button]:justify-center">{children}</div>

                <div className="px-2 pb-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full rounded-xl bg-gray-100 py-3 text-[17px] font-semibold text-gray-900 active:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

