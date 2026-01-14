export default function Home() {
  return (
    <main style={{
      display: 'flex',
      minHeight: '100vh',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '6rem'
    }}>
      <div style={{ maxWidth: '64rem', width: '100%' }}>
        <h1 style={{
          fontSize: '2.25rem',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          Welcome to SmartBudget
        </h1>
        <p style={{
          fontSize: '1.25rem',
          textAlign: 'center',
          color: 'var(--muted-foreground)'
        }}>
          Intelligent Personal Finance Management System
        </p>
      </div>
    </main>
  );
}
