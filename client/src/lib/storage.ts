import { supabase } from './supabase'

// ─── Listing Images (public bucket) ───────────────────────────────────────────

/**
 * Upload multiple listing images for a seller.
 * Path: listing-images/{sellerId}/{listingId}/{filename}
 * Returns array of public URLs.
 */
export async function uploadListingImages(
  files: File[],
  sellerId: string,
  listingId: string,
): Promise<string[]> {
  const urls: string[] = []

  for (const file of files) {
    const ext = file.name.split('.').pop()
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const path = `${sellerId}/${listingId}/${filename}`

    const { error } = await supabase.storage
      .from('listing-images')
      .upload(path, file, { upsert: false })

    if (error) throw new Error(`Failed to upload ${file.name}: ${error.message}`)

    const { data } = supabase.storage
      .from('listing-images')
      .getPublicUrl(path)

    urls.push(data.publicUrl)
  }

  return urls
}

/**
 * Delete listing images by their public URLs.
 * Extracts the storage path from the URL and removes the objects.
 */
export async function deleteListingImages(urls: string[]): Promise<void> {
  const paths = urls.map(url => {
    // Extract path after "/listing-images/"
    const match = url.match(/listing-images\/(.+)$/)
    return match ? match[1] : null
  }).filter(Boolean) as string[]

  if (paths.length === 0) return

  const { error } = await supabase.storage
    .from('listing-images')
    .remove(paths)

  if (error) throw new Error(`Failed to delete images: ${error.message}`)
}

// ─── KYC Documents (private bucket) ───────────────────────────────────────────

export type KycDocumentType = 'id_front' | 'id_back' | 'selfie'

/**
 * Upload a single KYC document for a user.
 * Path: kyc-documents/{userId}/{docType}.{ext}
 * Returns a signed URL valid for 1 hour (for immediate confirmation display).
 */
export async function uploadKycDocument(
  file: File,
  userId: string,
  docType: KycDocumentType,
): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `${userId}/${docType}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('kyc-documents')
    .upload(path, file, { upsert: true }) // upsert: resubmission replaces old doc

  if (uploadError) throw new Error(`Failed to upload ${docType}: ${uploadError.message}`)

  const { data, error: urlError } = await supabase.storage
    .from('kyc-documents')
    .createSignedUrl(path, 3600) // 1 hour

  if (urlError || !data) throw new Error(`Failed to get signed URL: ${urlError?.message}`)

  return data.signedUrl
}

/**
 * Generate a fresh signed URL for an existing KYC document path.
 * Used by the admin panel to view documents.
 * Path format: "{userId}/{docType}.{ext}"
 */
export async function getKycDocumentSignedUrl(
  path: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from('kyc-documents')
    .createSignedUrl(path, expiresInSeconds)

  if (error || !data) throw new Error(`Failed to get signed URL: ${error?.message}`)

  return data.signedUrl
}