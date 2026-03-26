import antsContent from './ants-content.svg';
import boxOpen from './box-open.svg';
import bullseyeFilter from './bullseye-filter.svg';
import callVoicemail from './call-voicemail.svg';
import campfireGather from './campfire-gather.svg';
import catContent from './cat-content.svg';
import cliffOpen from './cliff-open.svg';
import desertOpenResults from './desert-open-results.svg';
import favoriteApps from './favorite-apps.svg';
import hornsSuccess from './horns-success.svg';
import messageActivity from './message-activity.svg';
import wolfCall from './wolf-call.svg';

/**
 * Momentum Illustration Library — Empty State (Empty-Primary color variant).
 * Source: Figma Illustration Library `8K8Ma3gTsTOoUcs5VuEk58`, page "Empty States".
 */
export const illustrations = {
  'ants-content': antsContent,
  'box-open': boxOpen,
  'bullseye-filter': bullseyeFilter,
  'call-voicemail': callVoicemail,
  'campfire-gather': campfireGather,
  'cat-content': catContent,
  'cliff-open': cliffOpen,
  'desert-open-results': desertOpenResults,
  'favorite-apps': favoriteApps,
  'horns-success': hornsSuccess,
  'message-activity': messageActivity,
  'wolf-call': wolfCall,
} as const;

export type IllustrationName = keyof typeof illustrations;

export interface IllustrationProps {
  name: IllustrationName;
  size?: number;
  className?: string;
  alt?: string;
}

export function Illustration({ name, size = 192, className = '', alt = '' }: IllustrationProps) {
  return (
    <img
      src={illustrations[name]}
      width={size}
      height={size}
      alt={alt}
      className={`illustration${className ? ` ${className}` : ''}`}
      draggable={false}
    />
  );
}
