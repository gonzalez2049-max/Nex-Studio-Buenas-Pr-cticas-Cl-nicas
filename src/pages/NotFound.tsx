import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-5xl font-bold text-primary">404</p>
      <h1 className="mt-3 text-lg font-semibold">Página no encontrada</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        La ruta que buscas no existe en NEX Studio.
      </p>
      <Button asChild className="mt-6">
        <Link to="/">Volver al inicio</Link>
      </Button>
    </div>
  )
}
