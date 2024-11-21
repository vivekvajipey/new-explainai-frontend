import './globals.css';

export const metadata = {
  title: 'Document Explainer',
  description: 'AI-powered document analysis and conversation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}