import { PropsWithChildren } from 'react';

export function PageContainer({ children }: PropsWithChildren) {
  return <div className="space-y-6">{children}</div>;
}
