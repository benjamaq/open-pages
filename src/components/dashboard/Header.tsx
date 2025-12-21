import Image from 'next/image'
import Link from 'next/link'

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.svg" alt="BioStackr" width={32} height={32} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">BioStackr</h1>
              <p className="text-xs text-gray-500 mt-0.5">Pattern discovery for your health</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/upload" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-50">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 10l5-5 5 5M12 5v12"/></svg>
              <span className="text-sm font-medium">Import Data</span>
            </Link>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-sm font-medium">BM</span>
              </div>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}


