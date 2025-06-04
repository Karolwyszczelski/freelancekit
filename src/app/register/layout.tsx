// app/signup/layout.tsx
export const metadata = {
  title: 'Rejestracja • FreelanceKit',
}
export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="min-h-screen flex items-center justify-center">
        {children}
      </div>
    </>
  )
}
