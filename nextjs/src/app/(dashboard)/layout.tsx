import React from 'react';
import Logo from '@components/dashboard/layout/Logo';
import AuthorizationComponent from '@components/dashboard/Authorization';
import ThemeProviderLocal from '@components/dashboard/ThemeProviderLocal';
import SwitchModeButton from '@components/dashboard/layout/SwitchModeButton';
import NotificationButton from '@components/dashboard/layout/NotificationButton';
import ProfileMenuButton from '@components/dashboard/layout/ProfileMenuButton';
import Sidebar from '@components/dashboard/layout/Sidebar';
import '@app/(dashboard)/globals.css';
import Link from 'next/link';

export const metadata = {
    title: 'Next.js',
    description: 'Generated by Next.js',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <AuthorizationComponent>
                    <ThemeProviderLocal>
                        <div className="app-container">
                            <div className="app-header">
                                <div className="app-header-left">
                                    <Logo />
                                    <Link
                                        className="app-name"
                                        href="/dashboard"
                                    >
                                        ClassMate
                                    </Link>
                                </div>
                                <div className="app-header-right">
                                    <SwitchModeButton />
                                    <NotificationButton />
                                    <ProfileMenuButton />
                                </div>
                            </div>
                            <div className="app-content">
                                <Sidebar />
                                <AuthorizationComponent>
                                    {children}
                                </AuthorizationComponent>
                            </div>
                        </div>
                    </ThemeProviderLocal>
                </AuthorizationComponent>
            </body>
        </html>
    );
}
