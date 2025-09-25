
import { redirect } from 'next/navigation';

export default function HomePage() {
  // The root page should redirect to the main goal page.
  redirect('/goal');
}
