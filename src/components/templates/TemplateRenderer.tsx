import type { PortfolioData, Template } from '@/lib/types';
import SystemDark from './SystemDark';
import CleanLight from './CleanLight';
import SplitEditorial from './SplitEditorial';
import Broadsheet from './Broadsheet';
import WarmEditorial from './WarmEditorial';

interface Props {
  template: Template;
  data: PortfolioData;
  showBadge?: boolean;
}

export default function TemplateRenderer({ template, data, showBadge = true }: Props) {
  switch (template) {
    case 'clean-light':
      return <CleanLight data={data} showBadge={showBadge} />;
    case 'split-editorial':
      return <SplitEditorial data={data} showBadge={showBadge} />;
    case 'broadsheet':
      return <Broadsheet data={data} showBadge={showBadge} />;
    case 'warm-editorial':
      return <WarmEditorial data={data} showBadge={showBadge} />;
    case 'system-dark':
    default:
      return <SystemDark data={data} showBadge={showBadge} />;
  }
}
