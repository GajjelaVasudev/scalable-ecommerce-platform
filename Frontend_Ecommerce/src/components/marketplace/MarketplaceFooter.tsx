import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export const MarketplaceFooter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="w-full bg-inverse-surface text-inverse-on-surface pt-space-xl pb-space-lg mt-auto">
      <div className="max-w-7xl mx-auto px-margin">
        {/* Brand Row */}
        <div className="mb-space-xl pb-space-lg border-b border-surface-container-highest/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-xs">
            <Link to="/" data-path="home" className="inline-block">
              <img
                alt="OMIZON Official Brand Logo"
                className="h-9 w-auto object-contain"
                src="/logo-dark.svg"
              />
            </Link>
          </div>
          <p className="font-body-md text-inverse-on-surface/80 max-w-2xl">
            OMIZON — Everything customers need, brought together in one destination. International multi-category commerce engineered for quality.
          </p>
        </div>

        {/* 5-Column Navigation Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-space-xl mb-space-xl">
          {/* Col 1 */}
          <div className="flex flex-col gap-space-sm">
            <h4 className="font-title-sm text-surface-container-lowest tracking-wide uppercase">
              About OMIZON
            </h4>
            <ul className="flex flex-col gap-space-xs font-body-md text-inverse-on-surface/75">
              <li className="hover:text-primary-fixed cursor-pointer transition-colors">Our Story</li>
              <li className="hover:text-primary-fixed cursor-pointer transition-colors">Careers</li>
              <li className="hover:text-primary-fixed cursor-pointer transition-colors">Sustainability</li>
              <li className="hover:text-primary-fixed cursor-pointer transition-colors">Press Center</li>
              <li className="hover:text-primary-fixed cursor-pointer transition-colors">Investor Relations</li>
            </ul>
          </div>

          {/* Col 2 */}
          <div className="flex flex-col gap-space-sm">
            <h4 className="font-title-sm text-surface-container-lowest tracking-wide uppercase">
              Shop Categories
            </h4>
            <ul className="flex flex-col gap-space-xs font-body-md text-inverse-on-surface/75">
              <li>
                <Link to="/products?category=Electronics" className="hover:text-primary-fixed transition-colors">
                  Electronics
                </Link>
              </li>
              <li>
                <Link to="/products?category=Home+%26+Living" className="hover:text-primary-fixed transition-colors">
                  Home Living
                </Link>
              </li>
              <li>
                <Link to="/products?category=Grocery+%26+Essentials" className="hover:text-primary-fixed transition-colors">
                  Fresh Grocery
                </Link>
              </li>
              <li>
                <Link to="/products?category=Beauty+%26+Personal+Care" className="hover:text-primary-fixed transition-colors">
                  Beauty
                </Link>
              </li>
              <li>
                <Link to="/products?category=Fashion+%26+Apparel" className="hover:text-primary-fixed transition-colors">
                  Fashion
                </Link>
              </li>
              <li>
                <Link to="/products?deals=true" className="hover:text-primary-fixed transition-colors">
                  Daily Steals
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="flex flex-col gap-space-sm">
            <h4 className="font-title-sm text-surface-container-lowest tracking-wide uppercase">
              Customer Service
            </h4>
            <ul className="flex flex-col gap-space-xs font-body-md text-inverse-on-surface/75">
              <li className="hover:text-primary-fixed cursor-pointer transition-colors">Help Center</li>
              <li>
                <Link to="/orders" className="hover:text-primary-fixed transition-colors">
                  Track Your Order
                </Link>
              </li>
              <li className="hover:text-primary-fixed cursor-pointer transition-colors">Shipping &amp; Delivery</li>
              <li className="hover:text-primary-fixed cursor-pointer transition-colors">Return Policy</li>
              <li className="hover:text-primary-fixed cursor-pointer transition-colors">Payment Options</li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="flex flex-col gap-space-sm">
            <h4 className="font-title-sm text-surface-container-lowest tracking-wide uppercase">
              Sell with Us
            </h4>
            <ul className="flex flex-col gap-space-xs font-body-md text-inverse-on-surface/75">
              <li>
                <Link to="/seller/dashboard" className="hover:text-primary-fixed transition-colors">
                  Sell on OMIZON
                </Link>
              </li>
              <li>
                <Link to="/seller/dashboard" className="hover:text-primary-fixed transition-colors">
                  Seller Hub
                </Link>
              </li>
              <li className="hover:text-primary-fixed cursor-pointer transition-colors">Fulfilled by OMIZON</li>
              <li className="hover:text-primary-fixed cursor-pointer transition-colors">Seller University</li>
              <li className="hover:text-primary-fixed cursor-pointer transition-colors">Advertise</li>
            </ul>
          </div>

          {/* Col 5 */}
          <div className="flex flex-col gap-space-sm col-span-2 md:col-span-1">
            <h4 className="font-title-sm text-surface-container-lowest tracking-wide uppercase">
              Stay Connected
            </h4>
            <p className="font-body-sm text-inverse-on-surface/75">
              Subscribe for VIP offers, launches &amp; flash sales.
            </p>
            <form onSubmit={handleSubscribe} className="flex items-center bg-surface-container-lowest/10 rounded-lg p-1">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={subscribed ? 'Subscribed! Thank you.' : 'Your email address'}
                required
                className="bg-transparent border-0 outline-none text-surface-container-lowest placeholder:text-outline font-body-sm px-space-xs w-full"
              />
              <button
                type="submit"
                className="bg-primary hover:bg-secondary text-on-primary px-space-sm py-1.5 rounded font-label-md transition-colors shrink-0"
              >
                Join
              </button>
            </form>
            <div className="mt-space-sm flex flex-col gap-space-xs">
              <span className="font-label-sm text-outline uppercase">Secure Payment Methods</span>
              <div className="flex flex-wrap gap-space-xs text-surface-container-lowest/80">
                <span className="bg-surface-container-lowest/10 px-2 py-1 rounded text-label-sm font-label-sm font-semibold">
                  UPI
                </span>
                <span className="bg-surface-container-lowest/10 px-2 py-1 rounded text-label-sm font-label-sm font-semibold">
                  RuPay
                </span>
                <span className="bg-surface-container-lowest/10 px-2 py-1 rounded text-label-sm font-label-sm font-semibold">
                  Visa
                </span>
                <span className="bg-surface-container-lowest/10 px-2 py-1 rounded text-label-sm font-label-sm font-semibold">
                  Mastercard
                </span>
                <span className="bg-surface-container-lowest/10 px-2 py-1 rounded text-label-sm font-label-sm font-semibold">
                  NetBanking
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Legal & Copyright Row */}
        <div className="pt-space-lg border-t border-surface-container-highest/20 flex flex-col sm:flex-row items-center justify-between gap-space-sm text-body-sm text-inverse-on-surface/60">
          <p>© 2025 OMIZON Marketplace Inc. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-space-md">
            <a className="hover:text-surface-container-lowest transition-colors" href="#">
              Privacy Policy
            </a>
            <span>•</span>
            <a className="hover:text-surface-container-lowest transition-colors" href="#">
              Terms &amp; Conditions
            </a>
            <span>•</span>
            <a className="hover:text-surface-container-lowest transition-colors" href="#">
              Cookie Settings
            </a>
            <span>•</span>
            <a className="hover:text-surface-container-lowest transition-colors" href="#">
              Security
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
