import { redirect } from 'next/navigation';

export default function AdminUsersDeprecatedPage() {
  redirect('/admin/customers');
}
