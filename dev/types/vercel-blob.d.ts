declare module '@vercel/blob' {
  export interface PutBlobResult {
    url: string
    size: number
  }

  export interface HeadBlobResult {
    size: number
    contentType?: string
    uploadedAt: Date
  }

  export function put(
    path: string,
    data: Blob | ArrayBuffer | ArrayBufferView | File,
    options?: {
      access?: 'public' | 'private'
      contentType?: string
      addRandomSuffix?: boolean
    }
  ): Promise<PutBlobResult>

  export function head(url: string): Promise<HeadBlobResult | null>

  export function del(url: string): Promise<void>
}
