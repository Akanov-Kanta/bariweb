import { html } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { 
  Accessibility, 
  X, 
  Languages, 
  User, 
  Type, 
  Contrast, 
  Palette, 
  MousePointer2, 
  Volume2, 
  Eye, 
  Zap, 
  Brain, 
  Info,
  CircleCheckBig,
  ChevronDown,
  Sun,
  Moon,
  Droplet,
  RefreshCw
} from 'lucide-static';

const createIcon = (svgString: string) => html`${unsafeHTML(svgString)}`;

export const Icons = {
  accessibility: createIcon(Accessibility),
  close: createIcon(X),
  languages: createIcon(Languages),
  profiles: createIcon(User),
  textSize: createIcon(Type),
  contrast: createIcon(Contrast),
  grayscale: createIcon(Palette),
  cursor: createIcon(MousePointer2),
  screenReader: createIcon(Volume2),
  visualImpair: createIcon(Eye),
  seizureSafe: createIcon(Zap),
  cognitive: createIcon(Brain),
  info: createIcon(Info),
  check: createIcon(CircleCheckBig),
  chevronDown: createIcon(ChevronDown),
  sun: createIcon(Sun),
  moon: createIcon(Moon),
  droplet: createIcon(Droplet),
  refresh: createIcon(RefreshCw)
};
