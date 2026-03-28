'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WorkerReceiptsPage() {
  const router = useRouter();
  // Redirect to worker page with receipts tab active
  useEffect(() => {
    router.replace('/worker#receipts');
  }, [router]);
  return null;
}
