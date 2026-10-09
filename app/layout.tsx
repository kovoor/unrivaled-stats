import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Stats | Unrivaled',
    description: 'Explore Unrivaled team stats, player stats, and league leaders.',
};
export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
    themeColor: '#17181c',
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang='en' suppressHydrationWarning>
            <head>
                <link rel='preconnect' href='https://fonts.googleapis.com' />
                <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='anonymous' />
                <link
                    href='https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400&family=Roboto+Condensed:wght@400;500;600;700;800&family=Roboto+Mono:wght@400;500;600&display=swap'
                    rel='stylesheet'
                />
            </head>
            <body data-option='1e'>{children}</body>
        </html>
    );
}
