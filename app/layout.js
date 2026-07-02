import './globals.css';

export const metadata = {
  title: 'Markus Game Jams',
  description: 'Submit, browse, and moderate community game jam projects.',
  icons: {
    icon: '/favicon.svg'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
