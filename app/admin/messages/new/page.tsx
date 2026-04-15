'use client';

import { IndividualMessageForm } from '@/components/admin/IndividualMessageForm';

export default function NewMessagePage() {
  return (
    <IndividualMessageForm
      mode="create"
      initial={{
        slug: '',
        title: '',
        body_html: '',
        images: [],
        is_active: true,
      }}
    />
  );
}
