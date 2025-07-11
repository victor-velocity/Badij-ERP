import { Suspense } from 'react';
import EnterCodeFormContent from '@/components/login/EnterCodeForm';

export default function EnterCodePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading code verification form...</div>}>
      <EnterCodeFormContent />
    </Suspense>
  );
}