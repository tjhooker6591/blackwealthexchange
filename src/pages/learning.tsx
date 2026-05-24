import Link from "next/link";

export default function LearningPage() {
  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <h1 className="text-4xl font-bold text-[#D4AF37]">Learning Hub</h1>
        <p className="text-white/75">
          Choose free learning content or continue to gated courses.
        </p>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold">Free content</h2>
            <p className="mt-2 text-sm text-white/70">
              Open resources and public educational content.
            </p>
            <div className="mt-4 space-y-2 text-sm">
              <Link
                href="/resources"
                className="block text-[#D4AF37] hover:underline"
              >
                Employer Resources (Free)
              </Link>
              <Link
                href="/financial-literacy"
                className="block text-[#D4AF37] hover:underline"
              >
                Financial Literacy (Free)
              </Link>
              <Link
                href="/news"
                className="block text-[#D4AF37] hover:underline"
              >
                News & Insights (Free)
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold">
              Courses and premium learning
            </h2>
            <p className="mt-2 text-sm text-white/70">
              Structured course content may require login or enrollment.
            </p>
            <div className="mt-4 space-y-2 text-sm">
              <Link
                href="/courses"
                className="block text-[#D4AF37] hover:underline"
              >
                Courses (Login required / Premium or Enrolled)
              </Link>
              <Link
                href="/course-dashboard"
                className="block text-[#D4AF37] hover:underline"
              >
                Course Dashboard (Login required)
              </Link>
              <Link
                href="/course-enrollment"
                className="block text-[#D4AF37] hover:underline"
              >
                Course Enrollment (Premium / Enrolled)
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
