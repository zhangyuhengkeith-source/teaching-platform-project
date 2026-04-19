export function getSpaceWriteErrorMessage(error: unknown, action: "create" | "update" = "create"): string {
  const fallback = `Failed to ${action} space.`;
  const message = error instanceof Error ? error.message : fallback;

  if (message.includes("SUPABASE_SERVICE_ROLE_KEY is not available")) {
    return "服务端写入密钥未配置。请在 Vercel 项目环境变量中添加 SUPABASE_SERVICE_ROLE_KEY，然后重新部署。";
  }

  if (message.includes('row-level security policy for table "spaces"')) {
    return "数据库权限拒绝了本次班级写入。当前登录账号在 public.profiles 表中的身份尚未满足写入 spaces 的条件。请在 Supabase 中检查该账号对应的 public.profiles 记录，确认 status = 'active'，且 role = 'teacher' 或 'super_admin'，然后再重试。";
  }

  return message;
}
