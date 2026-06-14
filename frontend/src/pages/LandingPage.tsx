import { Link } from "react-router-dom";
import CanaraFooter from "../components/CanaraFooter";
import CanaraHeader from "../components/CanaraHeader";

const services = [
  {
    title: "Document Verification",
    desc: "AI-powered forensic analysis of submitted documents with real-time fraud detection.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    ),
  },
  {
    title: "Secure Authentication",
    desc: "Multi-factor login with email OTP and mobile verification for complete account security.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    ),
  },
  {
    title: "Fraud Detection",
    desc: "Advanced AI forensics to identify tampered, forged, or suspicious documents instantly.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    ),
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <CanaraHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-r from-canara-blue via-canara-blue-light to-canara-blue">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-canara-gold" />
          <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-canara-gold" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="max-w-2xl">
            <p className="mb-3 inline-block rounded bg-canara-gold px-3 py-1 text-xs font-bold uppercase tracking-widest text-canara-blue-dark">
              VeriTrust Digital Platform
            </p>
            <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
              Secure Document Verification
              <span className="mt-2 block text-canara-gold">Together We Can</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-blue-100">
              Trusted AI forensic document fraud detection for customers and bank employees.
              Register, verify, and manage documents with enterprise-grade security.
            </p>
          </div>
        </div>
        <div className="h-1 bg-canara-gold" />
      </section>

      {/* Portal cards */}
      <section className="bg-canara-cream py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <h2 className="section-title">Choose Your Portal</h2>
            <p className="mt-2 text-gray-600">Select the appropriate login to access VeriTrust services</p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <article className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-card transition hover:shadow-lg">
              <div className="bg-canara-blue px-6 py-4">
                <h3 className="text-xl font-bold text-white">Customer Portal</h3>
                <p className="text-sm text-blue-200">For account holders &amp; new customers</p>
              </div>
              <div className="p-6">
                <ul className="mb-6 space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-canara-gold" />
                    Register via Email or Mobile OTP
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-canara-gold" />
                    Submit documents for verification
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-canara-gold" />
                    Track verification status online
                  </li>
                </ul>
                <div className="flex flex-col gap-3">
                  <Link
                    to="/aadhaar/register"
                    className="btn-primary text-center"
                  >
                    Aadhaar + Face Registration
                  </Link>

                  <Link
                    to="/customer/register"
                    className="btn-gold text-center"
                  >
                    Mobile / Email Registration
                  </Link>

                  <Link
                    to="/customer/login"
                    className="btn-secondary text-center"
                  >
                    Customer Login
                  </Link>

                </div>
              </div>
            </article>

            <article className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-card transition hover:shadow-lg">
              <div className="bg-canara-blue-dark px-6 py-4">
                <h3 className="text-xl font-bold text-white">Employee Portal</h3>
                <p className="text-sm text-blue-200">For authorized bank staff only</p>
              </div>
              <div className="p-6">
                <ul className="mb-6 space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-canara-gold" />
                    Fraud analysis &amp; case management
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-canara-gold" />
                    Document review dashboard
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-canara-gold" />
                    Pre-authorized access only
                  </li>
                </ul>
                <Link to="/employee/login" className="btn-primary w-full text-center">
                  Staff Login
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <h2 className="section-title">Our Services</h2>
            <p className="mt-2 text-gray-600">Comprehensive digital verification powered by VeriTrust</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {services.map((s) => (
              <div key={s.title} className="rounded-lg border border-gray-100 bg-canara-cream p-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-canara-blue">
                  <svg className="h-7 w-7 text-canara-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {s.icon}
                  </svg>
                </div>
                <h3 className="font-bold text-canara-blue">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security banner */}
      <section className="bg-canara-blue py-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-8 px-4 text-center text-white sm:px-6">
          {["256-bit SSL Encryption", "OTP Verified Login", "AI Fraud Detection", "24×7 Secure Access"].map(
            (item) => (
              <div key={item} className="flex items-center gap-2 text-sm font-medium">
                <svg className="h-5 w-5 text-canara-gold" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {item}
              </div>
            )
          )}
        </div>
      </section>

      <CanaraFooter />
    </div>
  );
}
