import { AuthPanel } from "@/components/portal/AuthPanel";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <AuthPanel mode="reset" token={token} />;
}
