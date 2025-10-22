import AuthForm from '@/components/AuthForm'

export const dynamic = 'force-dynamic'

export default function SigninPage() {
  return (
    <AuthForm mode="signin" />
  )
}

import AuthForm from '../../../components/AuthForm'

export default function SignInPage() {
  return <AuthForm mode="signin" />
}