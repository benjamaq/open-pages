import { redirect } from 'next/navigation'

export default function SupplementAlias({ params }: { params: { id: string } }) {
  return redirect(`/supplements/${encodeURIComponent(params.id)}`)
}




