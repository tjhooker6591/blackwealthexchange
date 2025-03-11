import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const AdvertiseWithUs = () => {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Handle option selection
  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      {/* Back Button */}
      <section style={{ textAlign: 'left' }}>
        <button
          onClick={() => router.back()}
          style={{
            padding: '0.8rem 1.5rem',
            backgroundColor: '#000', // Black button color
            color: '#fff',
            borderRadius: '4px',
            textDecoration: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Back
        </button>
      </section>

      {/* Banner Section */}
      <section
        style={{
          textAlign: 'center',
          backgroundColor: '#333', // Dark background for contrast
          padding: '3rem 1.5rem',
          borderRadius: '8px',
          marginBottom: '2rem',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', // subtle shadow for depth
        }}
      >
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ffcc00' }}>
          Want to increase visibility for your business?
        </h1>
        <p style={{ fontSize: '1.1rem', marginTop: '1rem' }}>
          We offer a variety of advertising options to help you reach a larger, engaged audience. Please select an option below to proceed.
        </p>
      </section>

      {/* Advertising Options */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#ffcc00' }}>
          Advertising Options
        </h2>
        <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
          Please choose one of the following advertising options:
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <div
            onClick={() => handleOptionSelect('Featured Sponsor')}
            style={{
              cursor: 'pointer',
              padding: '1rem',
              backgroundColor: '#4A4A4A', // Gray background for options
              borderRadius: '8px',
              width: '200px',
              textAlign: 'center',
              transition: 'background-color 0.3s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ffcc00')} // Gold hover effect
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#4A4A4A')}
          >
            <h3 style={{ fontSize: '1.5rem', color: '#fff' }}>Featured Sponsor</h3>
            <p style={{ fontSize: '1rem', color: '#ccc' }}>
              Highlight your brand to a dedicated, engaged audience on our homepage.
            </p>
          </div>
          <div
            onClick={() => handleOptionSelect('Business Directory Listings')}
            style={{
              cursor: 'pointer',
              padding: '1rem',
              backgroundColor: '#4A4A4A',
              borderRadius: '8px',
              width: '200px',
              textAlign: 'center',
              transition: 'background-color 0.3s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ffcc00')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#4A4A4A')}
          >
            <h3 style={{ fontSize: '1.5rem', color: '#fff' }}>Business Directory</h3>
            <p style={{ fontSize: '1rem', color: '#ccc' }}>
              Get your business featured in our Black-owned business directory.
            </p>
          </div>
          <div
            onClick={() => handleOptionSelect('Banner Ads')}
            style={{
              cursor: 'pointer',
              padding: '1rem',
              backgroundColor: '#4A4A4A',
              borderRadius: '8px',
              width: '200px',
              textAlign: 'center',
              transition: 'background-color 0.3s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ffcc00')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#4A4A4A')}
          >
            <h3 style={{ fontSize: '1.5rem', color: '#fff' }}>Banner Ads</h3>
            <p style={{ fontSize: '1rem', color: '#ccc' }}>
              Place your ads on various high-traffic pages across the platform.
            </p>
          </div>
          <div
            onClick={() => handleOptionSelect('Custom Advertising Solutions')}
            style={{
              cursor: 'pointer',
              padding: '1rem',
              backgroundColor: '#4A4A4A',
              borderRadius: '8px',
              width: '200px',
              textAlign: 'center',
              transition: 'background-color 0.3s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ffcc00')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#4A4A4A')}
          >
            <h3 style={{ fontSize: '1.5rem', color: '#fff' }}>Custom Solutions</h3>
            <p style={{ fontSize: '1rem', color: '#ccc' }}>
              Let’s work together to create a tailored advertising plan for your business.
            </p>
          </div>
        </div>
      </section>

      {/* Next Steps Section */}
      {selectedOption && (
        <section style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', color: '#fff' }}>
            You Selected: {selectedOption}
          </h2>
          <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
            Great choice! Now, let's proceed to the next step. Please confirm your details and make the payment to get started.
          </p>
          <Link
            href={`/checkout?option=${selectedOption}`}
            style={{
              display: 'inline-block',
              backgroundColor: '#007bff', // Blue color for the button
              color: '#fff',
              padding: '0.8rem 2rem',
              borderRadius: '4px',
              textDecoration: 'none',
            }}
          >
            Proceed to Payment
          </Link>
        </section>
      )}
    </div>
  );
};

export default AdvertiseWithUs;