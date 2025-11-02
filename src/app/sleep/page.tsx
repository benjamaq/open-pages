export { default } from '../sleep-v2/page'

import SleepLandingClient from '@/components/sleep-landing/SleepLandingClient'
import Script from 'next/script'

export const metadata = {
  title: "Can't Sleep? Find Out Why | BioStackr",
  description: "Track sleep alongside daily factors. Discover what's ruining your rest in 7-14 days. Most people find 2-3 fixable triggers.",
}

export default function SleepLandingPage() {
  return (
    <>
      <Script id="clarity-script" strategy="afterInteractive">
        {`
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "tzotkrzmki");
        `}
      </Script>
      <SleepLandingClient />
    </>
  )
}


