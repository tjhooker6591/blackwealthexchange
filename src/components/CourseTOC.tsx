import Link from 'next/link';

export default function CourseTOC() {
  return (
    <nav className="mb-8">
      <h2 className="text-xl font-bold mb-4">Course Modules</h2>
      <ul className="space-y-2">
        <li>
          <Link href="/courses/investing-for-beginners/module-1" className="hover:underline text-gold-400">
            Module 1: Introduction to Investing & Why It Matters
          </Link>
        </li>
        <li>
          <Link href="/courses/investing-for-beginners/module-2" className="hover:underline text-gold-400">
            Module 2: Types of Investments
          </Link>
        </li>
        <li>
          <Link href="/courses/investing-for-beginners/module-3" className="hover:underline text-gold-400">
            Module 3: The Power of Compound Growth
          </Link>
        </li>
        <li>
          <Link href="/courses/investing-for-beginners/module-4" className="hover:underline text-gold-400">
            Module 4: Risk, Return, and Diversification
          </Link>
        </li>
        <li>
          <Link href="/courses/investing-for-beginners/module-5" className="hover:underline text-gold-400">
            Module 5: How to Get Started Step-by-Step
          </Link>
        </li>
        <li>
          <Link href="/courses/investing-for-beginners/module-6" className="hover:underline text-gold-400">
            Module 6: Supporting Black-Owned Businesses & Wealth
          </Link>
        </li>
        <li>
          <Link href="/courses/investing-for-beginners/module-7" className="hover:underline text-gold-400">
            Module 7: Investing in Gold, Silver & Alternatives
          </Link>
        </li>
        <li>
          <Link href="/courses/investing-for-beginners/module-8" className="hover:underline text-gold-400">
            Module 8: Avoiding Common Mistakes
          </Link>
        </li>
        <li>
          <Link href="/courses/investing-for-beginners/module-9" className="hover:underline text-gold-400">
            Module 9: Tools & Resources for Black Investors
          </Link>
        </li>
      </ul>
    </nav>
  );
}
