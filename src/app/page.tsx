import { redirect } from 'next/navigation';

export default function HomePage() {
  // The root page should redirect to the main goal page.
  // In a real app with authentication, this might redirect to a login page
  // or a user-specific dashboard.
  redirect('/goal');
}
