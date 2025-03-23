import Link from "next/link";

const ScholarshipsPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">
        Scholarships for Black Students
      </h1>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">
          Jackie Robinson Foundation Scholarship
        </h2>
        <p>
          The Jackie Robinson Foundation provides scholarships to outstanding
          minority students.
        </p>
        <Link
          href="https://jackierobinson.org/apply/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline mt-4 inline-block"
        >
          Apply Now
        </Link>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Ron Brown Scholar Program</h2>
        <p>
          The Ron Brown Scholar Program awards scholarships to outstanding
          African American students.
        </p>
        <Link
          href="https://ronbrown.org/apply/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline mt-4 inline-block"
        >
          Apply Now
        </Link>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">UNCF Scholarships</h2>
        <p>
          The United Negro College Fund (UNCF) offers a variety of scholarships
          for Black students.
        </p>
        <Link
          href="https://uncf.org/scholarships"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline mt-4 inline-block"
        >
          Apply Now
        </Link>
      </div>

      <h2 className="text-2xl font-bold mb-4">Additional Resources</h2>
      <div className="mb-4">
        <Link
          href="https://www.scholarships.com/financial-aid/college-scholarships/scholarship-directory/race/african-american"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline"
        >
          Scholarships.com: African American Scholarships
        </Link>
      </div>
      <div className="mb-8">
        <Link
          href="https://www.bold.org/scholarships/by-demographics/minorities/black-students-scholarships/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline"
        >
          Bold.org: Scholarships for Black Students
        </Link>
      </div>

      <Link href="/">
        <span className="px-6 py-3 bg-gold text-black font-semibold text-lg rounded-lg hover:bg-yellow-500 transition cursor-pointer inline-block">
          Back to Home
        </span>
      </Link>
    </div>
  );
};

export default ScholarshipsPage;
