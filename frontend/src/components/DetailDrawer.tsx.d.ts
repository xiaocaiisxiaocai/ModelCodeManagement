import { CodeUsageEntry } from '../mock/interfaces';

interface DetailDrawerProps {
  entry: CodeUsageEntry;
  onClose: () => void;
}

declare const DetailDrawer: React.FC<DetailDrawerProps>;

export default DetailDrawer; 