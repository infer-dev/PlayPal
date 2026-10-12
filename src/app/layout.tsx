import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'PlayPal — The outside is calling', description: 'Safe outdoor play, with friends. With an adult.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body style={{ margin: 0, background: '#faf9f6', color: '#292d2b', fontFamily: 'Arial, system-ui, sans-serif' }}>{children}</body></html>; }
