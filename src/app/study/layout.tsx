/**
 * Study routes: participate in root `flex min-h-screen` so the column fills the viewport
 * and the trust footer sits flush at the bottom — avoids an empty light strip that can
 * look like a stray control below the dark footer.
 */
export default function StudyLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-0 flex-1 flex-col">{children}</div>
}
