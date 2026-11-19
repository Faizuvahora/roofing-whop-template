import { createFileRoute } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { site } from '../site.config'
import { EstimateForm } from '../components/EstimateForm'
import { Financing, Footer, Hero, Pricing, Reviews, ServiceArea, Services, TrustBar } from '../components/Sections'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [{ title: `${site.company.name}: Roof Repair, Replacement & Inspections · ${site.company.address}` }],
  }),
  component: Home,
})

function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <TrustBar />
        <Services />
        <Pricing />
        <Financing />
        <ServiceArea />
        <Reviews />
        <EstimateForm />
      </main>
      <Footer />
    </>
  )
}
