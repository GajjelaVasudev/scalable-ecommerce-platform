import React from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: React.ReactNode;
  backTo?: {
    path: string;
    label: string;
  };
  showSecurityBadge?: boolean;
  catalogBadgeText?: string;
  catalogCountText?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  backTo,
  showSecurityBadge = true,
  catalogBadgeText = "Curated Spring Catalog '25",
  catalogCountText = '85K+ Items',
}) => {
  return (
    <div className="bg-[#FFFFFF] font-body-md text-[#211D31] antialiased min-h-screen w-full overflow-x-hidden">
      <main className="w-full min-h-screen flex flex-col lg:flex-row items-stretch">
        {/* LEFT PANEL: Editorial Brand & Category Showcase (46% width on desktop) */}
        <div className="w-full lg:w-[46%] lg:min-h-screen bg-gradient-to-br from-[#190B46] via-[#22105B] to-[#4C2ACB] p-8 md:p-12 lg:p-14 flex flex-col justify-between text-white relative overflow-hidden select-none">
          {/* Ambient Lighting Orbs inside container */}
          <div className="absolute -top-24 -left-20 w-80 h-80 rounded-full bg-[#762FF2]/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/3 -right-24 w-72 h-72 rounded-full bg-[#4C2ACB]/25 blur-3xl pointer-events-none" />

          {/* Top Section: Brand Identity & Value Proposition */}
          <div className="relative z-10 flex flex-col">
            {/* OMIZON Brand Logo on Dark Surface */}
            <div className="flex items-center mb-8">
              <Link to="/" className="inline-flex items-center gap-2.5 group">
                <img
                  src="/logo-dark.svg"
                  alt="OMIZON Official Brand Identity"
                  className="h-8 md:h-9 w-auto object-contain filter drop-shadow-md transition-transform group-hover:scale-105"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="font-headline-md text-headline-md tracking-wider uppercase text-white font-bold">
                  OMIZON
                </span>
                <span className="w-2 h-2 rounded-full bg-[#762FF2]" />
              </Link>
            </div>

            {/* Upper Copy */}
            <h1 className="font-headline-lg text-headline-md md:text-headline-lg font-bold tracking-tight text-white leading-tight">
              A world of choices.
              <br />
              <span className="text-[#E8E6F0]">One destination.</span>
            </h1>
            <p className="font-body-md text-body-md text-[#E8E6F0] mt-3.5 max-w-md leading-relaxed">
              Discover everything you love, from everyday essentials to curated products that elevate your lifestyle.
            </p>
          </div>

          {/* Center Still Life Image Artwork Card */}
          <div className="relative z-10 my-8 group">
            <div className="w-full h-[280px] sm:h-[320px] xl:h-[360px] rounded-2xl overflow-hidden shadow-2xl relative bg-[#190B46]/40">
              <img
                src="/auth-showcase.png"
                alt="Editorial luxury still life photography featuring headphones, smartwatch, luxury perfume, and sneakers"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              {/* Subtle inset gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#190B46]/80 via-transparent to-transparent pointer-events-none" />

              {/* Micro floating badge for catalog richness */}
              <div className="absolute bottom-3.5 left-4 right-4 flex items-center justify-between text-xs font-label-md text-white/95 bg-[#190B46]/75 backdrop-blur-md px-3.5 py-2 rounded-xl">
                <span className="flex items-center gap-1.5 font-medium tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {catalogBadgeText}
                </span>
                <span className="text-[#E8E6F0] font-label-sm font-semibold tracking-wider uppercase">
                  {catalogCountText}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Micro Footer */}
          <div className="relative z-10 pt-2 flex items-center justify-between">
            <span className="font-label-sm text-label-sm tracking-[0.25em] text-white/60 uppercase font-semibold">
              DISCOVER MORE. LIVE BETTER.
            </span>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#762FF2]" />
              <span className="font-body-sm text-body-sm text-white/70">Verified Global Commerce</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: High-Precision Customer Action Container (54% width on desktop) */}
        <div className="w-full lg:w-[54%] lg:min-h-screen bg-[#FFFFFF] flex flex-col justify-center items-center px-6 py-12 md:px-14 md:py-16">
          <div className="w-full max-w-[420px] mx-auto flex flex-col">
            {/* Top Back Link & Security Badge */}
            {(backTo || showSecurityBadge) && (
              <div className="w-full flex items-center justify-between mb-6">
                {backTo ? (
                  <Link
                    to={backTo.path}
                    className="inline-flex items-center gap-2 font-label-md text-label-md text-[#762FF2] hover:text-[#4C2ACB] transition-colors py-1 group"
                  >
                    <span className="material-symbols-outlined text-[18px] transition-transform duration-200 group-hover:-translate-x-1">
                      arrow_back
                    </span>
                    <span>{backTo.label}</span>
                  </Link>
                ) : (
                  <div />
                )}
                {showSecurityBadge && (
                  <div className="flex items-center gap-1.5 bg-[#F7F7FB] px-3 py-1 rounded-full border border-[#E8E6F0]/60">
                    <span
                      className="material-symbols-outlined text-[#762FF2] text-[15px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      verified_user
                    </span>
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-[#4A4456] font-semibold text-[11px]">
                      SSL 256-Bit
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Brand Marker (shows only when Left Panel is vertically stacked on small screens) */}
            <div className="lg:hidden flex items-center gap-2 mb-6">
              <Link to="/" className="inline-flex items-center gap-2">
                <span className="font-display-hero-mobile text-headline-sm font-bold text-[#211D31] tracking-tight">
                  OMIZON
                </span>
                <span className="w-2 h-2 rounded-full bg-[#762FF2]" />
              </Link>
            </div>

            {/* Injected Content / Form */}
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuthLayout;
