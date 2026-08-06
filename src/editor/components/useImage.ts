import { useEffect, useState } from 'react'

/** Carga una imagen (data URL o URL) para usarla en Konva. */
export function useImage(src: string): HTMLImageElement | undefined {
  const [image, setImage] = useState<HTMLImageElement>()

  useEffect(() => {
    if (!src) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    let active = true
    img.onload = () => {
      if (active) setImage(img)
    }
    img.src = src
    return () => {
      active = false
    }
  }, [src])

  return image
}
