import { Card, CardContent } from "@/components/ui/card";
import {
  DollarSign,
  ShoppingBag,
  Clock,
  PieChart,
  TrendingUp,
} from "lucide-react";

export default function TrillionImpactPage() {
  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-center mb-8">
        Black Dollars, Black Power: Reclaiming Economic Strength
      </h1>

      <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <DollarSign className="w-8 h-8 mr-2" />
            <h2 className="text-2xl font-semibold">
              The $1.8 Trillion Impact of African American Spending:
            </h2>
          </div>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Economic Contribution:</strong> African Americans
              contribute over $1.8 trillion annually.
            </li>
            <li>
              <strong>Global Comparison:</strong> This spending power ranks as
              the 4th largest GDP globally.
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <ShoppingBag className="w-8 h-8 mr-2" />
            <h2 className="text-2xl font-semibold">Where Black Dollars Go:</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Retail & Fashion:</strong> Nike, Louis Vuitton, H&M
              </li>
              <li>
                <strong>Beauty & Personal Care:</strong> L'Oréal, Procter &
                Gamble, Unilever
              </li>
            </ul>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Technology & Entertainment:</strong> Apple, Netflix,
                Spotify, Samsung
              </li>
              <li>
                <strong>Fast Food & Dining:</strong> McDonald's, Starbucks,
                Chick-fil-A
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-yellow-100">
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <Clock className="w-8 h-8 mr-2" />
            <h2 className="text-2xl font-semibold">
              The Short Life of the Black Dollar:
            </h2>
          </div>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Circulation Time:</strong> 6 hours within the Black
              community, compared to 20 days in Jewish and 30 days in Asian
              communities.
            </li>
            <li>
              <strong>Wealth Leakage:</strong> Most Black spending leaves the
              community.
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <PieChart className="w-8 h-8 mr-2" />
            <h2 className="text-2xl font-semibold">
              Who Profits from Black Spending?
            </h2>
          </div>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Corporations:</strong> Major brands gain billions with
              little reinvestment.
            </li>
            <li>
              <strong>Non-Black-Owned Businesses:</strong> Black dollars
              predominantly benefit businesses outside the community.
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card className="bg-green-100">
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="w-8 h-8 mr-2" />
            <h2 className="text-2xl font-semibold">
              Reclaiming Black Economic Power:
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Buy Black:</strong> Support Black-owned businesses.
              </li>
              <li>
                <strong>Bank Black:</strong> Use Black-owned financial
                institutions.
              </li>
            </ul>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Invest Black:</strong> Fund Black entrepreneurs.
              </li>
              <li>
                <strong>Educate Black:</strong> Promote financial literacy and
                entrepreneurship.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="text-center py-6 bg-gray-100 rounded-lg p-6">
        <h2 className="text-3xl font-bold mb-4">The Path Forward</h2>
        <p className="text-lg max-w-2xl mx-auto">
          Shifting spending habits toward Black-owned enterprises will create
          jobs, foster generational wealth, and empower the Black community.
        </p>
      </div>
    </div>
  );
}
