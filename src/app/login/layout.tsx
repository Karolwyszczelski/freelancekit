// app/login/layout.tsx

// UWAGA: NIE importujemy tu ponownie `globals.css`! 
//      One już są wczytane w root‐layout (app/layout.tsx),
//      więc wystarczy, że opakujemy dzieci w wrapper.
export const metadata = {
  title: 'Logowanie • FreelanceKit',
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* 
        Nie ma tutaj <html> ani <body>, bo to robi root‐layout. 
        Root‐layout załaduje globals.css, więc tło już będą mieliśmy. 
      */}
      <div className="min-h-screen flex items-center justify-center">
        {/* 
          Ten <div> może mieć np. klasę, która dodaje lekki overlay,
          blur, cokolwiek chcesz – ale i tak „w tle” widoczne jest tło z globals.css.
        */}
        {children}
      </div>
    </>
  )
}
