const LINKS = [
    { label: 'Newsletter', href: 'https://www.unrivaled.basketball/newsletter' },
    { label: 'Careers', href: 'https://www.unrivaled.basketball/careers' },
    { label: 'Contact Us', href: 'https://www.unrivaled.basketball/contact-us' },
    { label: 'Partners', href: 'https://www.unrivaled.basketball/partners' },
    { label: 'Privacy Policy', href: 'https://www.unrivaled.basketball/legal/privacy-policy' },
    { label: 'Terms of Use', href: 'https://www.unrivaled.basketball/legal/terms-of-use' },
];

// The hairline on top (::before) and the brand glow behind it (::after) are the theme's --hairline and --footer-glow.
export function SiteFooter() {
    return (
        <footer
            className='relative mt-18 flex justify-center overflow-hidden px-6 pt-12 pb-8 sm:mt-24 sm:px-12 sm:pt-16 sm:pb-10
                before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-(image:--hairline)
                after:pointer-events-none after:absolute after:top-0 after:left-1/2 after:h-75 after:w-[min(1100px,170vw)] after:-translate-x-1/2 after:bg-(image:--footer-glow)'
        >
            <div className='relative z-1 flex w-full max-w-[900px] flex-col items-center'>
                <a
                    className='aspect-[2000/223] w-75 max-w-[80%] bg-(image:--unrivaled-wordmark) bg-contain bg-center bg-no-repeat opacity-70'
                    href='https://www.unrivaled.basketball/'
                    aria-label='Unrivaled home'
                ></a>
                <nav className='mt-8 flex flex-wrap justify-center gap-x-7 gap-y-3' aria-label='Footer'>
                    {LINKS.map(link => (
                        <a
                            key={link.href}
                            className='px-0.5 py-1 text-[12px] font-medium tracking-[1.5px] text-white-60 uppercase hover:text-white-100'
                            href={link.href}
                        >
                            {link.label}
                        </a>
                    ))}
                </nav>
                <div className='mt-9 h-px w-16 bg-white-15'></div>
                <p className='mt-5 text-center text-[11px] tracking-[0.5px] text-white-40'>
                    {'© 2026 Unrivaled, LLC. All rights reserved.'}
                </p>
            </div>
        </footer>
    );
}
