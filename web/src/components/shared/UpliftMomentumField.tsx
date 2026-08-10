import type { ComponentProps } from 'react';
import {
  Input as MomentumInput,
  Select as MomentumSelect,
  Textarea as MomentumTextarea,
} from '@momentum-design/components/react';

const UPLIFT_FIELD_CLASS = 'uplift-momentum-field';

function fieldClassName(className?: string) {
  return className ? `${UPLIFT_FIELD_CLASS} ${className}` : UPLIFT_FIELD_CLASS;
}

/**
 * Reusable Momentum form fields aligned to the Webex Uplift input specification.
 * Keep state, validation, and accessibility props on the native Momentum controls.
 */
export function UpliftMomentumInput({
  className,
  ...props
}: ComponentProps<typeof MomentumInput>) {
  return <MomentumInput {...props} className={fieldClassName(className)} />;
}

export function UpliftMomentumTextarea({
  className,
  ...props
}: ComponentProps<typeof MomentumTextarea>) {
  return <MomentumTextarea {...props} className={fieldClassName(className)} />;
}

export function UpliftMomentumSelect({
  className,
  ...props
}: ComponentProps<typeof MomentumSelect>) {
  return <MomentumSelect {...props} className={fieldClassName(className)} />;
}
