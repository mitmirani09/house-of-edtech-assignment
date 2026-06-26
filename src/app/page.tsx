import Hero from '@/components/landing/Hero'
import FeatureSection from '@/components/landing/FeatureSection'
import { auth } from '@/auth'
import Footer from '@/components/common/Footer'

export default async function Home() {
  const session = await auth()
  const isLoggedIn = !!session?.user

  return (
    <div className="flex-1 flex flex-col bg-background min-h-screen relative overflow-hidden">

      {/* Hero Section */}
      <Hero isLoggedIn={isLoggedIn} />

      {/* Wavy Separator */}
      <div className="w-full bg-background overflow-hidden select-none pointer-events-none -mt-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 320"
          className="w-full h-auto block fill-primary text-primary"
          preserveAspectRatio="none"
        >
          <path d="M0,256L80,224C160,192,320,128,480,122.7C640,117,800,171,960,176C1120,181,1280,139,1360,117.3L1440,96L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
        </svg>
      </div>

      {/* Feature Section */}
      <FeatureSection />

      {/* Footer */}
      <footer className="bg-white py-8 px-6 text-center text-md">
        <Footer />
      </footer>
    </div>
  )
}
