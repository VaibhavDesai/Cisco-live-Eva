import type { ComponentProps } from 'react';
import { Button as MomentumButton } from '@momentum-design/components/react';

type MomentumButtonProps = ComponentProps<typeof MomentumButton>;
type UpliftButtonSize = MomentumButtonProps['size'] | 'default' | 'sm';

export type UpliftMomentumButtonProps = Omit<MomentumButtonProps, 'className' | 'size'> & {
  className?: string;
  size?: UpliftButtonSize;
};

const UPLIFT_BUTTON_CLASS = 'uplift-momentum-button';

function buttonClassName(className?: string) {
  return className ? `${UPLIFT_BUTTON_CLASS} ${className}` : UPLIFT_BUTTON_CLASS;
}

/**
 * Reusable Webex Uplift pill/icon button backed by the Momentum Button component.
 * The legacy density aliases keep migrations concise while still rendering native
 * Uplift sizes (40px default and 32px small).
 */
export function UpliftMomentumButton({
  className,
  size = 40,
  ...props
}: UpliftMomentumButtonProps) {
  const resolvedSize = size === 'sm' ? 32 : size === 'default' ? 40 : size;
  return (
    <MomentumButton
      {...props}
      size={resolvedSize}
      className={buttonClassName(className)}
    />
  );
}
