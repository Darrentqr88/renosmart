import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = 'RenoSmart <noreply@renosmart.app>';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://renosmart.vercel.app';

/** Send email via Resend — fails silently if not configured */
async function send(to: string, subject: string, html: string) {
  if (!resend) {
    console.log('[Email] Resend not configured, skipping:', subject, to);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    console.error('[Email] Send failed:', err);
  }
}

/** Welcome email on registration */
export async function sendWelcomeEmail(email: string, name: string, lang: string = 'EN') {
  const isZh = lang === 'ZH';
  const subject = isZh ? '欢迎加入 RenoSmart 🎉' : 'Welcome to RenoSmart 🎉';
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px;">
        <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#E8A317,#D4940F);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;color:#0B0F1A;">RS</div>
        <span style="font-size:18px;font-weight:700;color:#1A1A2E;">RenoSmart</span>
      </div>
      <h1 style="font-size:22px;font-weight:700;color:#1A1A2E;margin-bottom:8px;">
        ${isZh ? `你好 ${name}，欢迎！` : `Hey ${name}, welcome!`}
      </h1>
      <p style="font-size:14px;color:#6B7280;line-height:1.7;margin-bottom:24px;">
        ${isZh
          ? '你已成功注册 RenoSmart。上传你的第一份装修报价单，让 AI 帮你审计。'
          : 'Your account is ready. Upload your first renovation quotation and let AI audit it for errors.'}
      </p>
      <a href="${BASE_URL}/designer/quotation" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#4F8EF7,#8B5CF6);color:white;border-radius:12px;font-weight:600;font-size:14px;text-decoration:none;">
        ${isZh ? '上传报价单 →' : 'Upload Quotation →'}
      </a>
      <div style="margin-top:32px;padding-top:20px;border-top:1px solid #E5E7EB;">
        <p style="font-size:12px;color:#9CA3AF;">
          ${isZh ? '你有 3 次免费 AI 审计额度。' : 'You have 3 free AI audits to get started.'}
        </p>
      </div>
    </div>
  `;
  await send(email, subject, html);
}

/** Quota exhausted email — nudge to upgrade */
export async function sendQuotaHitEmail(email: string, name: string, plan: string, lang: string = 'EN') {
  const isZh = lang === 'ZH';
  const subject = isZh ? 'AI 审计额度已用完' : 'AI audit limit reached';
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px;">
        <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#E8A317,#D4940F);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;color:#0B0F1A;">RS</div>
        <span style="font-size:18px;font-weight:700;color:#1A1A2E;">RenoSmart</span>
      </div>
      <h1 style="font-size:22px;font-weight:700;color:#1A1A2E;margin-bottom:8px;">
        ${isZh ? `${name}，你的 AI 额度已用完` : `${name}, you've used all your AI audits`}
      </h1>
      <p style="font-size:14px;color:#6B7280;line-height:1.7;margin-bottom:8px;">
        ${isZh
          ? 'Pro 设计师每月通过 50 次 AI 审计，平均帮客户发现 RM8,000+ 的报价错误。'
          : 'Pro designers catch RM8,000+ in quotation errors monthly with 50 AI audits.'}
      </p>
      <div style="background:#F7F8FA;border-radius:12px;padding:16px;margin:20px 0;">
        <p style="font-size:13px;color:#4B5563;margin:0;">
          ${plan === 'free'
            ? (isZh ? '✓ 50 次 AI 审计/月<br>✓ 无限项目<br>✓ 价格数据库<br>✓ 工人管理' : '✓ 50 AI audits/month<br>✓ Unlimited projects<br>✓ Price database<br>✓ Worker management')
            : (isZh ? '✓ 250 次 AI 审计/月<br>✓ 成本数据库<br>✓ 团队协作<br>✓ API 访问' : '✓ 250 AI audits/month<br>✓ Cost database<br>✓ Team collaboration<br>✓ API access')}
        </p>
      </div>
      <a href="${BASE_URL}/designer/pricing?reason=quota_hit" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#4F8EF7,#8B5CF6);color:white;border-radius:12px;font-weight:600;font-size:14px;text-decoration:none;">
        ${isZh ? '升级方案 →' : 'Upgrade Now →'}
      </a>
      <p style="font-size:12px;color:#9CA3AF;margin-top:20px;">
        ${isZh ? '从 RM99/月起 · 随时取消' : 'From RM99/mo · Cancel anytime'}
      </p>
    </div>
  `;
  await send(email, subject, html);
}

/** First audit completed — value reinforcement */
export async function sendFirstAuditEmail(email: string, name: string, score: number, alertCount: number, lang: string = 'EN') {
  const isZh = lang === 'ZH';
  const subject = isZh ? `AI 审计完成 — 评分 ${score}/100` : `AI Audit Complete — Score: ${score}/100`;
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px;">
        <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#E8A317,#D4940F);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;color:#0B0F1A;">RS</div>
        <span style="font-size:18px;font-weight:700;color:#1A1A2E;">RenoSmart</span>
      </div>
      <h1 style="font-size:22px;font-weight:700;color:#1A1A2E;margin-bottom:8px;">
        ${isZh ? '你的首次 AI 审计结果出炉了！' : 'Your first AI audit is ready!'}
      </h1>
      <div style="background:linear-gradient(135deg,#4F8EF7,#8B5CF6);border-radius:16px;padding:24px;color:white;text-align:center;margin:20px 0;">
        <p style="font-size:48px;font-weight:800;margin:0;">${score}</p>
        <p style="font-size:14px;opacity:0.9;margin:4px 0 0;">/100</p>
      </div>
      <p style="font-size:14px;color:#6B7280;line-height:1.7;margin-bottom:24px;">
        ${isZh
          ? `AI 发现了 ${alertCount} 个问题。登录查看详细报告并开始修复。`
          : `AI found ${alertCount} alert${alertCount !== 1 ? 's' : ''} in your quotation. Log in to review the full report.`}
      </p>
      <a href="${BASE_URL}/designer" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#4F8EF7,#8B5CF6);color:white;border-radius:12px;font-weight:600;font-size:14px;text-decoration:none;">
        ${isZh ? '查看完整报告 →' : 'View Full Report →'}
      </a>
    </div>
  `;
  await send(email, subject, html);
}
