import AuthForm from '@/components/AuthForm'

export const dynamic = 'force-dynamic'

export default function SignupPage() {
  return (
    <AuthForm mode="signup" />
  )
}

import AuthForm from '../../../components/AuthForm'

export default function SignUpPage() {
  return <AuthForm mode="signup" />
}
