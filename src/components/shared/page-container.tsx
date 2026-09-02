import { PropsWithChildren } from 'react';

export function PageContainer({ children }: PropsWithChildren) {
  return <div className="min-w-0 space-y-5 sm:space-y-7">{children}</div>;
}
