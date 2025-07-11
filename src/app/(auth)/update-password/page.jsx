import { Suspense } from 'react';
import UpdatePasswordFormContent from '@/components/login/UpdatePasswordForm';

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading password update form...</div>}>
      <UpdatePasswordFormContent />
    </Suspense>
  );
}