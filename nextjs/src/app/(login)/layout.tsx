import '@app/(login)/globals.css'
import { Montserrat } from 'next/font/google'

const mont = Montserrat({
    weight: '700',
    subsets: ['latin'],
    display: 'swap'
})

export const metadata = {
    title: 'Create Next App',
    description: 'Generated by create next app',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body>
                {children}
            </body>
        </html>
    )
}
