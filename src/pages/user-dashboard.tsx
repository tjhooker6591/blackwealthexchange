// pages/user-dashboard.tsx
import { GetServerSideProps } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import Link from "next/link";
import clientPromise from "@/lib/mongodb";
import { getJwtSecret, getMongoDbName } from "@/lib/env";

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  description: string;
}

interface UserDashboardProps {
  savedJobs: Job[];
  userEmail: string;
}

type SessionPayload = {
  userId?: string;
  email?: string;
  accountType?: string;
  role?: string;
};

export default function UserDashboard({
  savedJobs,
  userEmail,
}: UserDashboardProps) {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Welcome, {userEmail}
        </h1>
        <p className="text-gray-600 mb-6">Here are your saved jobs:</p>
        {savedJobs.length === 0 ? (
          <p className="text-gray-500">You haven’t saved any jobs yet.</p>
        ) : (
          <div className="space-y-4">
            {savedJobs.map((job) => (
              <Link key={job._id} href={`/job/${job._id}/apply`}>
                <a className="block p-4 bg-gray-50 rounded shadow hover:bg-gray-100 transition">
                  <h2 className="text-xl font-semibold text-gray-800">
                    {job.title}
                  </h2>
                  <p className="text-gray-600">
                    {job.company} — {job.location}
                  </p>
                  {job.salary && (
                    <p className="text-gray-600">💰 {job.salary}</p>
                  )}
                  <p className="text-gray-700 mt-2 line-clamp-2">
                    {job.description}
                  </p>
                </a>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const cookies = cookie.parse(context.req.headers.cookie || "");
  const token = cookies.session_token;

  if (!token) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  let payload: SessionPayload;
  try {
    payload = jwt.verify(token, getJwtSecret()) as SessionPayload;
  } catch {
    return { redirect: { destination: "/login", permanent: false } };
  }

  const accountType = String(
    payload.accountType || payload.role || "user",
  ).toLowerCase();

  if (accountType !== "user" || !payload.email) {
    return { redirect: { destination: "/", permanent: false } };
  }

  const client = await clientPromise;
  const db = client.db(getMongoDbName());

  const userDoc = await db
    .collection("users")
    .findOne(
      ObjectId.isValid(String(payload.userId || ""))
        ? { _id: new ObjectId(String(payload.userId)) }
        : { email: String(payload.email).trim().toLowerCase() },
      { projection: { _id: 1, email: 1 } },
    );

  if (!userDoc?._id || !userDoc.email) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  // Load savedJobs documents for this user
  const savedDocs = await db
    .collection("savedJobs")
    .find({ userId: new ObjectId(String(userDoc._id)) })
    .toArray();

  const jobIds = savedDocs.map((doc) => new ObjectId(doc.jobId));

  // Fetch job details
  const jobs = await db
    .collection("jobs")
    .find({ _id: { $in: jobIds } })
    .toArray();

  const savedJobs: Job[] = jobs.map((job) => ({
    _id: job._id.toHexString(),
    title: job.title,
    company: job.company,
    location: job.location,
    type: job.type,
    salary: job.salary,
    description: job.description,
  }));

  return { props: { savedJobs, userEmail: userDoc.email } };
};
