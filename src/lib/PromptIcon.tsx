import {
  Hourglass,
  Coffee,
  Anchor,
  Scale,
  Atom,
  Mountain,
  Snowflake,
  Rainbow,
  Waves,
  Globe,
  Thermometer,
  CloudRain,
  Sandwich,
  Candy,
  Wine,
  Clapperboard,
  Drama,
  Gamepad2,
  Dices,
  Music,
  Music2,
  Volleyball,
  Footprints,
  Medal,
  Trophy,
  Building2,
  Landmark,
  Mountain as MountainAlt,
  Egg,
  Crown,
  Users,
  Droplet,
  Wind,
  DollarSign,
  Laptop,
  HardDrive,
  Ruler,
  BookOpen,
  ScrollText,
  Smartphone,
  Volume2,
  Type,
  Flame,
  Map,
  Rocket,
  Cat,
  Bird,
  Bone,
  Smile,
  Brain,
  Orbit,
  Heart,
  Calendar,
  Banknote,
  Lightbulb,
  Microscope,
  Network,
  type LucideIcon,
} from "lucide-react";

const EMOJI_TO_ICON: Record<string, LucideIcon> = {
  "⏳": Hourglass,
  "☕": Coffee,
  "⚓": Anchor,
  "⚖️": Scale,
  "⚛️": Atom,
  "⛰️": Mountain,
  "❄️": Snowflake,
  "🌈": Rainbow,
  "🌊": Waves,
  "🌐": Globe,
  "🌍": Globe,
  "🌡️": Thermometer,
  "🌧️": CloudRain,
  "🍔": Sandwich,
  "🍬": Candy,
  "🍷": Wine,
  "🍽️": Sandwich,
  "🎬": Clapperboard,
  "🎭": Drama,
  "🎮": Gamepad2,
  "🎲": Dices,
  "🎵": Music,
  "🎼": Music2,
  "🏀": Volleyball,
  "🏃": Footprints,
  "🏅": Medal,
  "🏆": Trophy,
  "🏙️": Building2,
  "🏛️": Landmark,
  "🏔️": MountainAlt,
  "🏞️": MountainAlt,
  "🐣": Egg,
  "👑": Crown,
  "👥": Users,
  "💧": Droplet,
  "💨": Wind,
  "💵": DollarSign,
  "💸": Banknote,
  "💻": Laptop,
  "💾": HardDrive,
  "💡": Lightbulb,
  "📏": Ruler,
  "📐": Ruler,
  "📅": Calendar,
  "📚": BookOpen,
  "📜": ScrollText,
  "📱": Smartphone,
  "🔊": Volume2,
  "🔤": Type,
  "🔥": Flame,
  "🔬": Microscope,
  "🗺️": Map,
  "🚀": Rocket,
  "🥚": Egg,
  "🦁": Cat,
  "🦅": Bird,
  "🦕": Bone,
  "🦴": Bone,
  "🦷": Smile,
  "🦵": Footprints,
  "🧠": Brain,
  "🪐": Orbit,
  "🫀": Heart,
};

interface PromptIconProps {
  emoji: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

/**
 * Renders a lucide icon for known theme/prompt emojis, falling back to the
 * emoji glyph itself when no mapping exists. Keeps level JSON data unchanged.
 */
export function PromptIcon({ emoji, size = 24, className, strokeWidth = 2 }: PromptIconProps) {
  const Icon = EMOJI_TO_ICON[emoji];
  if (Icon) {
    return (
      <Icon
        size={size}
        strokeWidth={strokeWidth}
        className={className}
        aria-hidden="true"
      />
    );
  }
  return (
    <span className={className} aria-hidden="true">
      {emoji}
    </span>
  );
}
