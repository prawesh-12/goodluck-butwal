import Script from "next/script";
import { eq } from "drizzle-orm";
import { db } from "@db/client";
import { settings } from "@db/schema";
import { gtmId } from "@/lib/analytics";

// The GA4 id is configured inside the container, not here, so changing measurement never needs
// a deploy. The container id itself comes from settings for the same reason.
export async function Analytics() {
  const [row] = await db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, "gtm_id"));

  const id = gtmId(row?.value);
  if (!id) return null;

  return (
    <Script id="gtm" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${id}');`}
    </Script>
  );
}
