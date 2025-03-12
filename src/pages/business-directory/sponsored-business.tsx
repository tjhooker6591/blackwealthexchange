import React from "react";

// Sample data for the sponsored business
const businessData = {
  name: "Premium Tech Solutions",
  description:
    "We provide top-tier tech solutions to help your business grow, from web development to cloud solutions.",
  services: [
    "Custom Web Development",
    "Cloud Hosting & Solutions",
    "E-commerce Platform Development",
    "Mobile App Development",
  ],
  contact: {
    phone: "+1 (800) 123-4567",
    email: "contact@premiumtech.com",
    address: "123 Tech Avenue, Silicon Valley, CA",
  },
  reviews: [
    {
      name: "John Doe",
      rating: 5,
      review: "Exceptional service! Helped me grow my online business.",
    },
    {
      name: "Jane Smith",
      rating: 4,
      review: "Great technical solutions, but communication could be improved.",
    },
  ],
  specialOffer: {
    title: "Exclusive Offer: 20% Off All Services",
    details:
      "Sign up for any of our services today and get 20% off your first project. Limited time offer!",
  },
};

const SponsoredBusiness = () => {
  return (
    <div className="container mx-auto p-6 bg-gray-50">
      {/* SEO Meta Tags */}
      <head>
        <title>{`${businessData.name} - Sponsored Business`}</title>
        <meta
          name="description"
          content={`Learn more about ${businessData.name}, a premium tech solutions provider offering web development, cloud hosting, and more.`}
        />
        <meta
          name="keywords"
          content="tech solutions, web development, cloud hosting, mobile apps, e-commerce"
        />
      </head>

      {/* Business Overview */}
      <section className="bg-gray-800 text-white p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl font-semibold text-center">
          {businessData.name}
        </h1>
        <p className="text-xl text-center mt-2">{businessData.description}</p>
      </section>

      {/* Services Offered */}
      <section className="mt-12">
        <h2 className="text-3xl font-semibold text-gray-800">Our Services</h2>
        <ul className="list-disc pl-8 mt-4 text-lg text-gray-600">
          {businessData.services.map((service, index) => (
            <li key={index} className="text-gray-800">
              {service}
            </li>
          ))}
        </ul>
      </section>

      {/* Special Offer */}
      <section className="mt-12">
        <h2 className="text-3xl font-semibold text-gray-800">Special Offer</h2>
        <div className="bg-yellow-500 p-6 rounded-lg mt-4 text-white">
          <h3 className="text-2xl font-bold">
            {businessData.specialOffer.title}
          </h3>
          <p className="text-lg mt-2">{businessData.specialOffer.details}</p>
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="mt-12">
        <h2 className="text-3xl font-semibold text-gray-800">
          Customer Testimonials
        </h2>
        <div className="mt-4">
          {businessData.reviews.map((review, index) => (
            <div key={index} className="border-b py-4">
              <div className="flex items-center">
                <div className="text-lg font-bold text-gray-800">
                  {review.name}
                </div>
                <div className="ml-2 text-yellow-500">
                  {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)}
                </div>
              </div>
              <p className="text-gray-600 mt-2">{review.review}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Information */}
      <section className="mt-12 bg-gray-800 text-white p-8 rounded-lg">
        <h2 className="text-3xl font-semibold">Contact Us</h2>
        <p className="mt-4 text-lg">
          Feel free to reach out to us for more information or to get started
          with our services.
        </p>
        <div className="mt-6">
          <p>
            <strong>Phone:</strong> {businessData.contact.phone}
          </p>
          <p>
            <strong>Email:</strong>{" "}
            <a
              href={`mailto:${businessData.contact.email}`}
              className="text-yellow-300 hover:underline"
            >
              {businessData.contact.email}
            </a>
          </p>
          <p>
            <strong>Address:</strong> {businessData.contact.address}
          </p>
        </div>
      </section>

      {/* Call to Action */}
      <section className="mt-12 text-center">
        <a
          href="#contact"
          className="text-white bg-blue-500 hover:bg-blue-700 py-2 px-6 rounded-full"
        >
          Get in Touch
        </a>
      </section>
    </div>
  );
};

export default SponsoredBusiness;
