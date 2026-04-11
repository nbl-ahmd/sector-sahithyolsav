import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { UNIT_LIST, getFamilyFrameRoute } from "@/lib/constants";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Image as ImageIcon, Users, LayoutDashboard, Crown, Flame } from "lucide-react";

export default function HomePage() {
  const familyFrameLink = getFamilyFrameRoute();

  return (
    <AppShell
      title="Overview"
      subtitle="Welcome to Sector Sahityolsav Studio"
    >
      {/* Top Banner (Like the "Remaining time to completion" in the screenshot) */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <Card className="border-none shadow-sm bg-white overflow-hidden relative">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-sm font-medium text-slate-500">Active Units</p>
                <h3 className="text-3xl font-bold tracking-tight text-slate-900 mt-1">{UNIT_LIST.length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white overflow-hidden relative">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-sm font-medium text-slate-500">Framing Studio</p>
                <h3 className="text-3xl font-bold tracking-tight text-slate-900 mt-1">Ready</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-amber-50 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-amber-100 rounded-bl-full -mr-8 -mt-8 pointer-events-none" />
          <CardContent className="p-6 relative z-10">
            <div className="flex flex-col h-full justify-between">
              <h3 className="text-lg flex items-center gap-2 font-bold text-amber-900">
                Sector Sahityolsav <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
              </h3>
              <div className="mt-4 flex gap-4 text-amber-900">
                <div className="text-center">
                  <span className="block text-3xl font-black">20</span>
                  <span className="text-xs font-semibold uppercase tracking-wider opacity-70">Days</span>
                </div>
                <div className="text-3xl font-black opacity-25">:</div>
                <div className="text-center">
                  <span className="block text-3xl font-black">12</span>
                  <span className="text-xs font-semibold uppercase tracking-wider opacity-70">Hours</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Quick Actions</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ImageIcon className="w-5 h-5 text-primary" />
              Family Frame Workflow
            </CardTitle>
            <CardDescription className="text-sm">
              Distribute links and enable families to easily frame and share their images.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full justify-between bg-white text-slate-700 border-slate-200 hover:bg-slate-50 border hover:text-slate-900 shadow-sm">
              <Link href="/family">
                Open Family Section
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <LayoutDashboard className="w-5 h-5 text-primary" />
              Admin Configuration
            </CardTitle>
            <CardDescription className="text-sm">
              Configure frames, manage uploads, and track usage data by units securely.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full justify-between bg-white text-slate-700 border-slate-200 hover:bg-slate-50 border hover:text-slate-900 shadow-sm">
              <Link href="/admin">
                Go to Admin Panel
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Crown className="w-5 h-5 text-primary" />
              Leaderboard & Stats
            </CardTitle>
            <CardDescription className="text-sm">
              Monitor individual unit standings and overall sector performance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full justify-between bg-white text-slate-700 border-slate-200 hover:bg-slate-50 border hover:text-slate-900 shadow-sm">
              <Link href="/sector">
                View Sector Stats
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Participating Units</h2>
      </div>

      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500 tracking-wider">
              <tr>
                <th className="px-6 py-4">Unit Name</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Quick Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {UNIT_LIST.map((unit) => (
                <tr key={unit} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                      {unit.substring(0, 2).toUpperCase()}
                    </div>
                    {unit}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 font-semibold border-emerald-200">
                      Active
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary hover:bg-primary/10">
                      <Link href={`${familyFrameLink}?unit=${encodeURIComponent(unit)}`}>
                        Frame Image
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
