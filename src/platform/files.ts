/**
 * Guardado de archivos multiplataforma (src/platform).
 *
 * En web basta con un `<a download>`, pero en la WebView de Android eso no
 * produce ninguna descarga: hay que escribir el archivo con el Filesystem nativo
 * y ofrecer la hoja de compartir/guardar del sistema.
 */
import { detectPlatform } from './notifications'

export interface SaveResult {
  ok: boolean
  where: 'web' | 'native' | 'error'
  /** Ubicación del archivo guardado (nativo) o nombre descargado (web). */
  location: string
}

function blobToBase64(blob: Blob): Promise<string> {
  return blob.arrayBuffer().then((buf) => {
    const bytes = new Uint8Array(buf)
    const chunk = 0x8000
    let binary = ''
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
    }
    return btoa(binary)
  })
}

function downloadInBrowser(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Escribe `filename` en la carpeta Documentos de la app y abre el diálogo de compartir. */
export async function saveOrShareFile(filename: string, blob: Blob): Promise<SaveResult> {
  const platform = detectPlatform()
  if (platform === 'web') {
    downloadInBrowser(filename, blob)
    return { ok: true, where: 'web', location: filename }
  }
  try {
    const { Directory, Filesystem } = await import('@capacitor/filesystem')
    const { Share } = await import('@capacitor/share')
    const written = await Filesystem.writeFile({
      path: `FocusFlow/${filename}`,
      data: await blobToBase64(blob),
      directory: Directory.Documents,
      recursive: true,
    })
    // Si el usuario cancela el diálogo, el archivo ya quedó guardado.
    await Share.share({
      title: filename,
      url: written.uri,
      dialogTitle: 'Guardar o compartir',
    }).catch(() => undefined)
    return { ok: true, where: 'native', location: written.uri }
  } catch (err) {
    return { ok: false, where: 'error', location: (err as Error).message }
  }
}
