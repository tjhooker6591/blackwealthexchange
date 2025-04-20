// src/pages/affiliate/index.tsx
import { GetServerSideProps, NextPage } from 'next';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import Image from 'next/image';

interface AffiliateOffer {
  id: number;
  title: string;
  description: string;
  image: string;
  payout: string;
  url: string;
}

// JWT payload now expects userId instead of id
interface JwtPayload {
  userId: string;
  accountType: string;
  iat: number;
  exp: number;
}

interface AffiliateProps {
  user: {
    id: string;         // mapped from payload.userId
    accountType: string;
  };
}

// Prefix 'user' with underscore to mark as intentionally unused
const AffiliatePartnershipPage: NextPage<AffiliateProps> = ({ user: _user }) => {
  const [affiliateOffers, setAffiliateOffers] = useState<AffiliateOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mockOffers: AffiliateOffer[] = [
      {
        id: 1,
        title: 'Featured Sponsor Upgrade',
        description: 'Earn 15% every time someone upgrades their business to a Featured Sponsor package.',
        image: '/images/affiliate/featured.png',
        payout: '15% rev‑share',
        url: '/advertising/featured-sponsor',
      },
      {
        id: 2,
        title: 'Marketplace Seller Referral',
        description: 'Get $25 when a referral lists their first product on the Marketplace.',
        image: '/images/affiliate/seller.png',
        payout: '$25 flat',
        url: '/marketplace/become-a-seller',
      },
      {
        id: 3,
        title: 'Premium Membership',
        description: 'Pocket 20 % recurring for every month your referral stays premium.',
        image: '/images/affiliate/premium.png',
        payout: '20 % MRR',
        url: '/pricing',
      },
    ];

    const timer = setTimeout(() => {
      setAffiliateOffers(mockOffers);
      setLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading…
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Affiliate &amp; Partnership Program | Black Wealth Exchange</title>
      </Head>

      <div className="min-h-screen bg-black text-white overflow-x-hidden">
        {/* Intro */}
        <section className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gold-500 mb-4 drop-shadow-lg">
            Empower Black Entrepreneurship
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8">
            Join our Affiliate &amp; Partnership Program to access exclusive opportunities and grow your business.
          </p>
          <Link
            href="/affiliate/signup"
            className="inline-block px-8 py-4 bg-gold-500 text-white font-bold rounded hover:bg-gold-400 hover:text-gold-500 transition-colors duration-200"
          >
            Join Our Program
          </Link>
        </section>

        {/* How It Works */}
        <section className="container mx-auto px-4 py-12">
          <h2 className="text-4xl font-bold text-gold-500 text-center mb-6">How It Works</h2>
          <p className="text-center text-xl text-gray-300 mb-12">
            Monetize your traffic and collaborate with us in three simple steps.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: 1, title: 'Sign Up', path: '/affiliate/signup' },
              { step: 2, title: 'Recommend', path: '/affiliate/recommend' },
              { step: 3, title: 'Earn', path: '/affiliate/earn' },
            ].map(({ step, title, path }) => (
              <div
                key={step}
                className="bg-gray-800 p-6 rounded-lg shadow hover:shadow-xl transition"
              >
                <div className="mb-4">
                  <span className="text-5xl text-gold-500">{step}</span>
                </div>
                <h3 className="text-2xl font-semibold text-gold-500 mb-2">{title}</h3>
                <p className="text-gray-300 mb-4">
                  {step === 1 && 'Apply in minutes with our dedicated form.'}
                  {step === 2 && 'Grab your unique links & share everywhere.'}
                  {step === 3 && 'Track clicks, sales, & payouts in real-time.'}
                </p>
                <Link
                  href={path}
                  className="inline-block px-6 py-3 bg-gold-500 text-white font-semibold rounded hover:bg-gold-400 hover:text-gold-500 transition-colors duration-200"
                >
                  {step === 1 ? 'Apply Now' : 'Learn More'}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Affiliate Offers */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold text-gold-500 text-center mb-10">Current Offers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {affiliateOffers.map((offer) => (
              <div
                key={offer.id}
                className="bg-gray-900 rounded-lg overflow-hidden shadow hover:shadow-xl transition"
              >
                <div className="relative h-40">
                  <Image
                    src={offer.image}
                    alt={offer.title}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover"
                    priority
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-semibold text-gold-500 mb-2">{offer.title}</h3>
                  <p className="text-gray-300 mb-4">{offer.description}</p>
                  <p className="text-sm font-medium mb-6">{offer.payout}</p>
                  <Link
                    href={offer.url}
                    className="inline-block w-full text-center px-6 py-3 bg-gold-500 text-white font-semibold rounded hover:bg-gold-400 hover:text-gold-500 transition-colors duration-200"
                  >
                    Promote Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<AffiliateProps> = async ({ req }) => {
  const cookies = parse(req.headers.cookie || '');
  const token = cookies.session_token;

  if (!token) {
    return {
      redirect: {
        destination: '/login?next=/affiliate',
        permanent: false,
      },
    };
  }

  try {
    // Verify using JWT_SECRET or NEXTAUTH_SECRET directly
    const secret = process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET;
    const payload = jwt.verify(token, secret as string) as JwtPayload;

    return {
      props: {
        user: {
          id: payload.userId,           // map userId to id
          accountType: payload.accountType,
        },
      },
    };
  } catch (err) {
    console.error('JWT verify failed', err);
    return {
      redirect: {
        destination: '/login?next=/affiliate',
        permanent: false,
      },
    };
  }
};

export default AffiliatePartnershipPage;
