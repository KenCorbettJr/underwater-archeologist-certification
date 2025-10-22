import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen ocean-bg relative overflow-hidden">
      {/* Animated bubbles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="bubble w-4 h-4"></div>
        <div className="bubble w-6 h-6"></div>
        <div className="bubble w-3 h-3"></div>
        <div className="bubble w-5 h-5"></div>
        <div className="bubble w-4 h-4"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 flex justify-between items-center">
        <div className="text-white font-bold text-xl">
          🏛️ Underwater Archeology Academy
        </div>
        <div className="flex items-center gap-4">
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-wave">
            Dive Into History
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Explore ancient underwater civilizations, learn archeological techniques, 
            and become a certified junior underwater archeologist!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <SignUpButton mode="modal">
              <Button size="lg" className="bg-sand-400 hover:bg-sand-500 text-sand-900 font-semibold px-8 py-4 text-lg">
                Start Your Journey
              </Button>
            </SignUpButton>
            
            <SignInButton mode="modal">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-ocean-600 px-8 py-4 text-lg">
                Continue Learning
              </Button>
            </SignInButton>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-16 max-w-6xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
            <div className="text-4xl mb-4">🏺</div>
            <h3 className="text-xl font-semibold mb-2">Discover Artifacts</h3>
            <p className="text-blue-100">
              Learn about ancient pottery, tools, and treasures found beneath the waves
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
            <div className="text-4xl mb-4">🤿</div>
            <h3 className="text-xl font-semibold mb-2">Master Techniques</h3>
            <p className="text-blue-100">
              Practice underwater excavation, documentation, and conservation methods
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold mb-2">Get Certified</h3>
            <p className="text-blue-100">
              Complete challenges and earn your junior underwater archeologist certification
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}