import * as LucideIcons from 'lucide-react';
import { IconConfig } from './IconLibrary';

interface IconRendererProps {
  config: IconConfig;
  className?: string;
}

// Map of icon names to components
const getIconComponent = (name: string): React.ComponentType<any> | null => {
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<any>>;
  return icons[name] || null;
};

export const IconRenderer = ({ config, className }: IconRendererProps) => {
  // Handle custom uploaded icons
  if (config.customImageUrl) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{
          transform: config.rotation ? `rotate(${config.rotation}deg)` : undefined,
        }}
      >
        <div
          className="flex items-center justify-center"
          style={{
            backgroundColor: config.backgroundColor || 'transparent',
            borderRadius: config.backgroundRadius || 0,
            padding: config.backgroundColor ? 12 : 0,
          }}
        >
          <img
            src={config.customImageUrl}
            alt={config.name}
            style={{
              width: config.size,
              height: config.size,
              objectFit: 'contain',
            }}
          />
        </div>
      </div>
    );
  }

  const IconComponent = getIconComponent(config.name);

  if (!IconComponent) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <span className="text-muted-foreground text-xs">Icon not found</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{
        transform: config.rotation ? `rotate(${config.rotation}deg)` : undefined,
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          backgroundColor: config.backgroundColor || 'transparent',
          borderRadius: config.backgroundRadius || 0,
          padding: config.backgroundColor ? 12 : 0,
        }}
      >
        <IconComponent
          style={{
            width: config.size,
            height: config.size,
            color: config.color,
            strokeWidth: config.strokeWidth,
          }}
        />
      </div>
    </div>
  );
};

export default IconRenderer;
