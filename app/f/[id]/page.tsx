import { redirect } from "next/navigation";
import { getFamilyFrameRoute } from "@/lib/constants";

export default async function LegacyTemplatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const nextQuery = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => nextQuery.append(key, item));
      return;
    }
    if (typeof value === "string" && value.length > 0) {
      nextQuery.set(key, value);
    }
  });

  const queryString = nextQuery.toString();
  const destination = queryString
    ? `${getFamilyFrameRoute(id)}?${queryString}`
    : getFamilyFrameRoute(id);

  redirect(destination);
}
