import { redirect } from 'next/navigation'

export default async function SupplementAlias({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return redirect(`/supplements/${encodeURIComponent(id)}`)
}




