import { FileSchema } from '@/services/file';

export interface PreviewProps {
  file: FileSchema;
  className?: string | string[];
  controls?: boolean;
  style?: Record<string, number | string>;
}
