import { CodeUsageEntry } from '../mock/interfaces';

interface EditModalProps {
  entry: CodeUsageEntry;
  onClose: () => void;
}

declare const EditModal: React.FC<EditModalProps>;

export default EditModal; 