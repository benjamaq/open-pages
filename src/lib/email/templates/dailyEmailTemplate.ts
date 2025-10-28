type TemplateParams = {
  userName: string;
  greeting: string;
  painToneLine: string;
  moodLine?: string;
  sleepImpactLine?: string;
  insightLine?: string;
  strongPraise?: boolean;
};

export function renderDailyEmailTemplate(params: TemplateParams): string {
  const {
    userName,
    greeting,
    painToneLine,
    moodLine = "",
    sleepImpactLine = "",
    insightLine = "",
    strongPraise = false,
  } = params;

  const praiseEmoji = strongPraise ? " ✨" : "";

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Daily Check-in</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background:#fafafa; color:#111; margin:0; padding:0; }
      .container { max-width: 600px; margin: 0 auto; background:#ffffff; padding:24px; }
      .h1 { font-size: 20px; font-weight: 700; margin:0 0 12px; }
      .p  { font-size: 15px; line-height: 1.6; margin:0 0 12px; }
      .hr { border:0; height:1px; background:#eee; margin:16px 0; }
      .footer { font-size:12px; color:#666; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="h1">Daily Check-in${praiseEmoji}</div>
      <p class="p">${greeting}</p>
      <p class="p">${painToneLine}</p>
      ${moodLine ? `<p class="p">${moodLine}</p>` : ''}
      ${sleepImpactLine ? `<p class="p">${sleepImpactLine}</p>` : ''}
      ${insightLine ? `<p class="p">${insightLine}</p>` : ''}
      <hr class="hr" />
      <p class="footer">You’re receiving this because you opted in to daily check-ins. Manage preferences in Settings.</p>
    </div>
  </body>
</html>`;
}


